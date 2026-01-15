import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PointLedgerService } from './pointledger.service';
import { PointLedger } from './pointledger.entity';
import { PointsSummaryResponse, TransactionHistoryResponse } from './dto/pointledger.dto';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Resolver()
export class PointLedgerResolver {
  constructor(private pointLedgerService: PointLedgerService) {}

  @Query(() => PointsSummaryResponse)
  @UseGuards(GqlAuthGuard)
  async getPointsSummary(@CurrentUser() user: User): Promise<PointsSummaryResponse> {
    return this.pointLedgerService.getUserPointsSummary(user.id);
  }

  @Query(() => [PointLedger])
  @UseGuards(GqlAuthGuard)
  async getTransactionHistory(
    @CurrentUser() user: User,
    @Args('limit', { defaultValue: 50 }) limit: number,
    @Args('offset', { defaultValue: 0 }) offset: number,
  ): Promise<PointLedger[]> {
    return this.pointLedgerService.getUserTransactionHistory(user.id, limit, offset);
  }

  @Query(() => [String])
  async getPointsRules(): Promise<string[]> {
    const rules = this.pointLedgerService.getPointsRules();
    return Object.keys(rules);
  }

  @Query(() => Number)
  @UseGuards(GqlAuthGuard)
  async getUserCurrentPoints(@CurrentUser() user: User): Promise<number> {
    const summary = await this.pointLedgerService.getUserPointsSummary(user.id);
    return summary.currentPoints;
  }

  @Query(() => String)
  @UseGuards(GqlAuthGuard)
  async getUserCurrentLevel(@CurrentUser() user: User): Promise<string> {
    const summary = await this.pointLedgerService.getUserPointsSummary(user.id);
    return summary.currentLevel;
  }
}
