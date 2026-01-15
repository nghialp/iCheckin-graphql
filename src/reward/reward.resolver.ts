import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Reward } from './reward.entity';
import { RewardService } from './reward.service';
import { CreateRewardInput, UpdateRewardInput } from './dto/reward.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { PointLedgerService } from 'src/pointledger/pointledger.service';
import { RedeemRewardResponse } from 'src/pointledger/dto/pointledger.dto';
import { RedemptionEligibility, RewardStats } from './dto/redeem-reward.input';
import { VoucherDetailsResponse } from 'src/voucher/dto/voucher.dto';

@Resolver(() => Reward)
export class RewardResolver {
  private readonly logger = new Logger(RewardResolver.name);

  constructor(
    private rewardService: RewardService,
    private pointLedgerService: PointLedgerService,
  ) {}

  /**
   * Get all rewards with pagination
   */
  @Query(() => [Reward])
  async rewards(
    @Args('limit', { type: () => Int, defaultValue: 100 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<Reward[]> {
    this.logger.debug(`Fetching rewards with limit=${limit}, offset=${offset}`);
    const { rewards } = await this.rewardService.getAllRewards(limit, offset);
    return rewards;
  }

  /**
   * Get reward count
   */
  @Query(() => Int)
  async rewardCount(): Promise<number> {
    this.logger.debug(`Getting reward count`);
    const { total } = await this.rewardService.getAllRewards(1, 0);
    return total;
  }

  /**
   * Get reward by ID
   */
  @Query(() => Reward, { nullable: true })
  async reward(@Args('id', { type: () => ID }) id: string): Promise<Reward | null> {
    this.logger.debug(`Fetching reward ${id}`);
    return this.rewardService.getRewardById(id);
  }

  /**
   * Get available rewards (with stock > 0)
   */
  @Query(() => [Reward])
  async availableRewards(): Promise<Reward[]> {
    this.logger.debug(`Fetching available rewards`);
    return this.rewardService.getAvailableRewards();
  }

  /**
   * Get rewards by category
   */
  @Query(() => [Reward])
  async rewardsByCategory(@Args('category') category: string): Promise<Reward[]> {
    this.logger.debug(`Fetching rewards by category: ${category}`);
    return this.rewardService.getRewardsByCategory(category);
  }

  /**
   * Create a new reward (admin only)
   */
  @Mutation(() => Reward)
  @UseGuards(GqlAuthGuard)
  async createReward(
    @Args('data') data: CreateRewardInput,
    @CurrentUser() user: User,
  ): Promise<Reward> {
    this.logger.log(`Creating reward by user ${user?.id}`);

    // TODO: Add admin role check
    // if (!user?.isAdmin) {
    //   throw new Error('Only admins can create rewards');
    // }

    return this.rewardService.createReward(data);
  }

  /**
   * Update reward (admin only)
   */
  @Mutation(() => Reward)
  @UseGuards(GqlAuthGuard)
  async updateReward(
    @Args('id', { type: () => ID }) id: string,
    @Args('data') data: UpdateRewardInput,
    @CurrentUser() user: User,
  ): Promise<Reward> {
    this.logger.log(`Updating reward ${id} by user ${user?.id}`);

    // TODO: Add admin role check
    const reward = await this.rewardService.getRewardById(id);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }

    return this.rewardService.updateReward(id, data);
  }

  /**
   * Delete reward (admin only)
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteReward(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    this.logger.log(`Deleting reward ${id} by user ${user?.id}`);

    // TODO: Add admin role check
    return this.rewardService.deleteReward(id);
  }

  /**
   * Get reward stats
   */
  @Query(() => RewardStats)
  async getRewardStats() {
    return this.rewardService.getRewardStats();
  }

  /**
   * Redeem a reward for the current user
   * Creates a voucher and deducts points
   */
  @Mutation(() => RedeemRewardResponse)
  @UseGuards(GqlAuthGuard)
  async redeemReward(
    @Args('rewardId', { type: () => ID }) rewardId: string,
    @CurrentUser() user: User,
  ): Promise<RedeemRewardResponse> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    this.logger.log(`User ${user.id} attempting to redeem reward ${rewardId}`);

    try {
      const result = await this.pointLedgerService.redeemReward(user.id, rewardId);
      return {
        success: true,
        voucher: result.voucher,
        message: 'Reward redeemed successfully',
      };
    } catch (error) {
      this.logger.error(`Redemption failed: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get user's vouchers (redeemed rewards)
   */
  @Query(() => [VoucherDetailsResponse])
  @UseGuards(GqlAuthGuard)
  async getUserVouchers(
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @CurrentUser() user?: User,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    this.logger.debug(`Fetching vouchers for user ${user.id}, status: ${status || 'all'}`);
    return this.pointLedgerService.getUserVouchers(user.id, status);
  }

  /**
   * Check if user can redeem a specific reward
   */
  @Query(() => RedemptionEligibility)
  @UseGuards(GqlAuthGuard)
  async checkRedemptionEligibility(
    @Args('rewardId', { type: () => ID }) rewardId: string,
    @CurrentUser() user: User,
  ): Promise<{ eligible: boolean; reason?: string; pointsNeeded?: number }> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    this.logger.debug(`Checking redemption eligibility for user ${user.id} on reward ${rewardId}`);

    try {
      // Get reward
      const reward = await this.rewardService.getRewardById(rewardId);
      if (!reward) {
        return { eligible: false, reason: 'Reward not found' };
      }

      // Check availability
      const isAvailable = await this.rewardService.isRewardAvailable(rewardId, user.points_balance);
      if (!isAvailable) {
        return {
          eligible: false,
          reason: 'Reward is not available',
          pointsNeeded: reward.points_required,
        };
      }

      // Check if user has enough points
      if (user.points_balance < reward.points_required) {
        return {
          eligible: false,
          reason: 'Insufficient points',
          pointsNeeded: reward.points_required - user.points_balance,
        };
      }

      return { eligible: true };
    } catch (error) {
      this.logger.error(`Eligibility check failed: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}
