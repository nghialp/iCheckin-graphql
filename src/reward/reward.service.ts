import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './reward.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateRewardInput, UpdateRewardInput } from './dto/reward.input';
import { RewardStats } from './dto/redeem-reward.input';

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
}
