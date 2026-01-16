import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './reward.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateRewardInput, UpdateRewardInput } from './dto/reward.input';
import { RedeemHistoryDto, RewardItemDto, RewardStats, UserRewardsDto } from './dto/reward-query.dto';

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);

  constructor(
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new reward
   */
  async createReward(input: CreateRewardInput): Promise<Reward> {
    this.logger.log(`Creating new reward: ${input.title}`);

    // Validate input
    if (!input.title || input.title.trim().length === 0) {
      throw new BadRequestException('Reward title is required');
    }

    if (input.points_required < 0) {
      throw new BadRequestException('Required points must be greater than or equal to 0');
    }

    if ((input.stock || 0) < 0) {
      throw new BadRequestException('Stock must be greater than or equal to 0');
    }

    const reward = this.rewardRepository.create({
      ...input,
      status: 'available',
    });
    const saved = await this.rewardRepository.save(reward);

    this.logger.log(`Reward created with ID: ${saved.id}`);
    return saved;
  }

  /**
   * Get all rewards
   */
  async getAllRewards(limit: number = 100, offset: number = 0): Promise<{ rewards: Reward[]; total: number }> {
    this.logger.debug(`Fetching rewards with limit=${limit}, offset=${offset}`);

    const [rewards, total] = await this.rewardRepository.findAndCount({
      order: { points_required: 'ASC' },
      take: limit,
      skip: offset,
    });

    return { rewards, total };
  }

  /**
   * Get reward by ID
   */
  async getRewardById(id: string): Promise<Reward | null> {
    this.logger.debug(`Fetching reward with ID: ${id}`);

    return this.rewardRepository.findOne({ where: { id } });
  }

  /**
   * Get available rewards (with stock > 0)
   */
  async getAvailableRewards(): Promise<Reward[]> {
    this.logger.debug(`Fetching available rewards`);

    return this.rewardRepository
      .createQueryBuilder('reward')
      .where('reward.stock > 0')
      .andWhere('reward.status = :status', { status: 'available' })
      .orderBy('reward.points_required', 'ASC')
      .getMany();
  }

  /**
   * Get rewards by category
   */
  async getRewardsByCategory(category: string): Promise<Reward[]> {
    this.logger.debug(`Fetching rewards by category: ${category}`);

    return this.rewardRepository.find({
      where: { category, status: 'available' },
      order: { points_required: 'ASC' },
    });
  }

  /**
   * Update reward
   */
  async updateReward(id: string, input: UpdateRewardInput): Promise<Reward> {
    this.logger.log(`Updating reward with ID: ${id}`);

    const reward = await this.getRewardById(id);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }

    // Validate input if provided
    if (input.stock !== undefined && input.stock < 0) {
      throw new BadRequestException('Stock must be greater than or equal to 0');
    }

    // Update fields
    if (input.title !== undefined) reward.title = input.title;
    if (input.description !== undefined) reward.description = input.description;
    if (input.stock !== undefined) reward.stock = input.stock;
    if (input.status !== undefined) reward.status = input.status;
    if (input.expiry_date !== undefined) reward.expiry_date = input.expiry_date;

    const updated = await this.rewardRepository.save(reward);
    this.logger.log(`Reward ${id} updated successfully`);

    return updated;
  }

  /**
   * Delete reward
   */
  async deleteReward(id: string): Promise<boolean> {
    this.logger.log(`Deleting reward with ID: ${id}`);

    const reward = await this.getRewardById(id);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }

    await this.rewardRepository.remove(reward);
    this.logger.log(`Reward ${id} deleted successfully`);

    return true;
  }

  /**
   * Decrease reward stock
   */
  async decreaseStock(rewardId: string, amount: number = 1): Promise<Reward> {
    const reward = await this.getRewardById(rewardId);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${rewardId} not found`);
    }

    reward.stock = Math.max(0, reward.stock - amount);
    if (reward.stock === 0) {
      reward.status = 'out_of_stock';
    }

    return this.rewardRepository.save(reward);
  }

  /**
   * Check if reward is available for purchase
   */
  async isRewardAvailable(rewardId: string, userPoints: number): Promise<{ available: boolean; message: string }> {
    const reward = await this.getRewardById(rewardId);

    if (!reward) {
      return { available: false, message: 'Reward not found' };
    }

    if (reward.status !== 'available') {
      return { available: false, message: `Reward is ${reward.status}` };
    }

    if (reward.stock <= 0) {
      return { available: false, message: 'Reward is out of stock' };
    }

    if (userPoints < reward.points_required) {
      return { available: false, message: `Insufficient points. Required: ${reward.points_required}, Available: ${userPoints}` };
    }

    if (reward.expiry_date && new Date() > reward.expiry_date) {
      return { available: false, message: 'Reward has expired' };
    }

    return { available: true, message: 'Reward is available' };
  }

  /**
   * Get reward stats
   */
  async getRewardStats(): Promise<RewardStats> {
    const total = await this.rewardRepository.count();
    const available = await this.rewardRepository.count({
      where: { status: 'available' },
    });
    const outOfStock = await this.rewardRepository.count({
      where: { status: 'out_of_stock' },
    });
    const expired = await this.rewardRepository.count({
      where: { status: 'expired' },
    });

    return {
      total,
      available,
      outOfStock,
      expired,
    };
  }

  /**
   * Get user rewards summary with available rewards
   */
  async getUserRewards(userId: string, limit: number = 20, offset: number = 0): Promise<UserRewardsDto> {
    this.logger.debug(`Fetching rewards for user ${userId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get available rewards
    const [rewards, total] = await this.rewardRepository.findAndCount({
      where: { status: 'available' },
      order: { points_required: 'ASC' },
      take: limit,
      skip: offset,
    });

    // Calculate tier based on points
    let tier = 'BRONZE';
    let nextTierPoints = 500;
    if (user.points_balance >= 500) tier = 'SILVER', nextTierPoints = 2000;
    if (user.points_balance >= 2000) tier = 'GOLD', nextTierPoints = 5000;
    if (user.points_balance >= 5000) tier = 'PLATINUM', nextTierPoints = 10000;

    return {
      currentPoints: user.points_balance,
      tier,
      nextTierPoints,
      totalRedeemed: 0, // TODO: Count redeemed vouchers for user
      rewards: rewards.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        image: r.image_url,
        pointsRequired: r.points_required,
        category: r.category,
        partner: r.partner_id,
        inStock: r.stock > 0 && r.status === 'available',
        likes: 0, // TODO: Implement likes
        redeemed: 0, // TODO: Count redeemed instances
        isLimited: r.stock < 10,
        expiresAt: r.expiry_date,
        tier,
        redeemCode: `CODE-${r.id.substring(0, 8).toUpperCase()}`,
        qrCode: `https://qr.example.com/${r.id}`, // TODO: Generate real QR code    
      })),
    };
  }

  /**
   * Get reward detail with all information
   */
  async getRewardDetail(id: string): Promise<RewardItemDto> {
    this.logger.debug(`Fetching reward detail: ${id}`);

    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    return {
      id: reward.id,
      title: reward.title,
      description: reward.description,
      image: reward.image_url,
      pointsRequired: reward.points_required,
      category: reward.category,
      partner: reward.partner_id,
      inStock: reward.stock > 0 && reward.status === 'available',
      likes: 0, // TODO: Implement likes
      redeemed: 0, // TODO: Count redeemed instances
      isLimited: reward.stock < 10,
      expiresAt: reward.expiry_date,
      qrCode: `https://qr.example.com/${reward.id}`, // TODO: Generate real QR code
      redeemCode: `CODE-${reward.id.substring(0, 8).toUpperCase()}`,
      partnerContact: 'contact@partner.com', // TODO: Get from partner info
      validUntil: reward.expiry_date,
      tier: reward.points_required >= 5000 ? 'PLATINUM' :
            reward.points_required >= 2000 ? 'GOLD' :
            reward.points_required >= 500 ? 'SILVER' : 'BRONZE',
    };
  }

  /**
   * Get user's redeem history (vouchers)
   */
  async getUserRedeemHistory(userId: string, limit: number = 20, offset: number = 0): Promise<RedeemHistoryDto> {
    this.logger.debug(`Fetching redeem history for user ${userId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Query from Voucher table once it's integrated
    // For now, return mock data structure
    return {
      items: [],
      total: 0,
      limit,
      offset,
    };
  }
}

