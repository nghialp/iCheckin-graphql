import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointLedger } from './pointledger.entity';
import { User } from 'src/user/entities/user.entity';
import { Reward } from 'src/reward/reward.entity';
import { Voucher } from 'src/voucher/voucher.entity';
import { Place } from 'src/place/place.entity';

interface PointTransactionInput {
  userId: string;
  actionType: string;
  pointsChange: number;
  locationId?: string;
  rewardId?: string;
  voucherId?: string;
  note?: string;
}

@Injectable()
export class PointLedgerService {
  private readonly logger = new Logger(PointLedgerService.name);

  // Points earning rules
  private readonly POINTS_RULES: Record<string, number> = {
    'check-in': 20,
    'review': 50,
    'like': 5,
    'comment': 10,
    'share': 15,
    'achievement': 30,
    'bonus': 100,
  };

  // User level thresholds
  private readonly LEVEL_THRESHOLDS = {
    'BRONZE': 0,
    'SILVER': 500,
    'GOLD': 2000,
    'PLATINUM': 5000,
  };

  constructor(
    @InjectRepository(PointLedger)
    private ledgerRepository: Repository<PointLedger>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
  ) {}

  /**
   * Add points to user account and record in ledger
   */
  async addPoints(input: PointTransactionInput): Promise<PointLedger> {
    const user = await this.userRepository.findOne({ where: { id: input.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${input.userId} not found`);
    }

    // Calculate new balance
    const newBalance = user.points_balance + input.pointsChange;
    if (newBalance < 0) {
      throw new BadRequestException('Insufficient points balance');
    }

    // Update user points
    user.points_balance = newBalance;
    user.points = newBalance; // Keep points field in sync
    user.level = this.calculateLevel(newBalance);
    await this.userRepository.save(user);

    // Create ledger entry
    const ledgerEntry = this.ledgerRepository.create({
      transaction_id: this.generateTransactionId(),
      user,
      action_type: input.actionType,
      points_change: input.pointsChange,
      balance_after: newBalance,
      note: input.note,
    });

    // Add optional relations
    if (input.locationId) {
      const location = await this.placeRepository.findOne({ where: { id: input.locationId } });
      if (location) {
        ledgerEntry.location = location;
      }
    }

    if (input.rewardId) {
      const reward = await this.rewardRepository.findOne({ where: { id: input.rewardId } });
      if (reward) {
        ledgerEntry.reward = reward;
      }
    }

    if (input.voucherId) {
      const voucher = await this.voucherRepository.findOne({ where: { id: input.voucherId } });
      if (voucher) {
        ledgerEntry.voucher = voucher;
      }
    }

    const saved = await this.ledgerRepository.save(ledgerEntry);
    this.logger.log(`Points transaction: User ${input.userId}, ${input.pointsChange} points, New balance: ${newBalance}`);

    return saved;
  }

  /**
   * Reward user for an action
   */
  async rewardForAction(userId: string, actionType: string, locationId?: string): Promise<PointLedger> {
    const points = this.POINTS_RULES[actionType] || 0;
    if (points <= 0) {
      throw new BadRequestException(`Invalid action type for rewards: ${actionType}`);
    }

    return this.addPoints({
      userId,
      actionType,
      pointsChange: points,
      locationId,
      note: `Reward for ${actionType}`,
    });
  }

  /**
   * Redeem reward and create voucher
   */
  async redeemReward(userId: string, rewardId: string): Promise<{ voucher: Voucher; ledger: PointLedger }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const reward = await this.rewardRepository.findOne({ where: { id: rewardId } });
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${rewardId} not found`);
    }

    // Check if reward is available
    if (reward.status !== 'available') {
      throw new BadRequestException(`Reward is not available: ${reward.status}`);
    }

    // Check if user has enough points
    if (user.points_balance < reward.points_required) {
      throw new BadRequestException(
        `Insufficient points. Required: ${reward.points_required}, Available: ${user.points_balance}`
      );
    }

    // Check stock
    if (reward.stock <= 0) {
      throw new BadRequestException('Reward is out of stock');
    }

    // Create voucher
    const voucher = this.voucherRepository.create({
      user,
      reward,
      voucher_code: this.generateVoucherCode(),
      qr_code: this.generateQRCode(),
      redeem_date: new Date(),
      expiry_date: reward.expiry_date,
      status: 'unused',
    });

    const savedVoucher = await this.voucherRepository.save(voucher);

    // Deduct points from user
    const ledgerEntry = await this.addPoints({
      userId,
      actionType: 'redemption',
      pointsChange: -reward.points_required,
      rewardId,
      voucherId: savedVoucher.id,
      note: `Redeemed reward: ${reward.title}`,
    });

    // Decrease reward stock
    reward.stock -= 1;
    if (reward.stock === 0) {
      reward.status = 'out_of_stock';
    }
    await this.rewardRepository.save(reward);

    this.logger.log(`User ${userId} redeemed reward ${rewardId}, got voucher ${savedVoucher.id}`);

    return { voucher: savedVoucher, ledger: ledgerEntry };
  }

  /**
   * Use a voucher
   */
  async useVoucher(voucherId: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { id: voucherId },
      relations: ['user', 'reward'],
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${voucherId} not found`);
    }

    // Check if voucher is still valid
    if (voucher.status !== 'unused') {
      throw new BadRequestException(`Voucher is already ${voucher.status}`);
    }

    if (voucher.expiry_date && new Date() > voucher.expiry_date) {
      voucher.status = 'expired';
      await this.voucherRepository.save(voucher);
      throw new BadRequestException('Voucher has expired');
    }

    // Mark as used
    voucher.status = 'used';
    voucher.used_date = new Date();

    const saved = await this.voucherRepository.save(voucher);
    this.logger.log(`Voucher ${voucherId} used by user ${voucher.user.id}`);

    return saved;
  }

  /**
   * Get user's transaction history
   */
  async getUserTransactionHistory(userId: string, limit: number = 50, offset: number = 0): Promise<PointLedger[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.ledgerRepository.find({
      where: { user: { id: userId } },
      relations: ['location', 'reward', 'voucher'],
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get user's vouchers
   */
  async getUserVouchers(userId: string, status?: string): Promise<Voucher[]> {
    const query = this.voucherRepository
      .createQueryBuilder('voucher')
      .where('voucher.user_id = :userId', { userId })
      .leftJoinAndSelect('voucher.reward', 'reward');

    if (status) {
      query.andWhere('voucher.status = :status', { status });
    }

    return query.orderBy('voucher.redeem_date', 'DESC').getMany();
  }

  /**
   * Calculate user level based on points
   */
  private calculateLevel(points: number): string {
    if (points >= this.LEVEL_THRESHOLDS['PLATINUM']) {
      return 'PLATINUM';
    }
    if (points >= this.LEVEL_THRESHOLDS['GOLD']) {
      return 'GOLD';
    }
    if (points >= this.LEVEL_THRESHOLDS['SILVER']) {
      return 'SILVER';
    }
    return 'BRONZE';
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate voucher code
   */
  private generateVoucherCode(): string {
    return `VCHR-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }

  /**
   * Generate QR code (placeholder - would use QR library in production)
   */
  private generateQRCode(): string {
    const code = this.generateVoucherCode();
    return `https://qr.example.com/generate?data=${encodeURIComponent(code)}`;
  }

  /**
   * Get points earning rules
   */
  getPointsRules() {
    return this.POINTS_RULES;
  }

  /**
   * Get level thresholds
   */
  getLevelThresholds() {
    return this.LEVEL_THRESHOLDS;
  }

  /**
   * Get user points summary
   */
  async getUserPointsSummary(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const transactionCount = await this.ledgerRepository.count({
      where: { user: { id: userId } },
    });

    const voucherCount = await this.voucherRepository.count({
      where: { user: { id: userId } },
    });

    const unusedVoucherCount = await this.voucherRepository.count({
      where: { user: { id: userId }, status: 'unused' },
    });

    return {
      userId,
      currentPoints: user.points_balance,
      currentLevel: user.level,
      totalTransactions: transactionCount,
      totalVouchers: voucherCount,
      unusedVouchers: unusedVoucherCount,
      nextLevelThreshold: this.getNextLevelThreshold(user.points_balance),
      pointsToNextLevel: this.getPointsToNextLevel(user.points_balance),
    };
  }

  /**
   * Get next level threshold
   */
  private getNextLevelThreshold(currentPoints: number): number {
    const levels = Object.entries(this.LEVEL_THRESHOLDS)
      .sort(([, a], [, b]) => a - b)
      .map(([, threshold]) => threshold);

    for (const threshold of levels) {
      if (currentPoints < threshold) {
        return threshold;
      }
    }

    return this.LEVEL_THRESHOLDS['PLATINUM']; // Already at max
  }

  /**
   * Get points needed to reach next level
   */
  private getPointsToNextLevel(currentPoints: number): number {
    const nextThreshold = this.getNextLevelThreshold(currentPoints);
    return Math.max(0, nextThreshold - currentPoints);
  }
}
