import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Reward } from 'src/reward/reward.entity';
import { Place } from 'src/place/place.entity';
import { Voucher } from 'src/voucher/voucher.entity';

@ObjectType()
export class PointTransactionResponse {
  @Field()
  transaction_id: string;

  @Field()
  action_type: string;

  @Field()
  points_change: number;

  @Field()
  balance_after: number;

  @Field(() => User)
  user: User;

  @Field({ nullable: true })
  note?: string;

  @Field()
  timestamp: Date;
}

@ObjectType()
export class PointsSummaryResponse {
  @Field()
  userId: string;

  @Field()
  currentPoints: number;

  @Field()
  currentLevel: string;

  @Field()
  totalTransactions: number;

  @Field()
  totalVouchers: number;

  @Field()
  unusedVouchers: number;

  @Field()
  nextLevelThreshold: number;

  @Field()
  pointsToNextLevel: number;
}

@ObjectType()
export class PointsRulesResponse {
  @Field()
  action: string;

  @Field()
  points: number;
}

@ObjectType()
export class LevelThresholdResponse {
  @Field()
  level: string;

  @Field()
  requiredPoints: number;
}

@ObjectType()
export class TransactionHistoryResponse {
  @Field()
  total: number;

  @Field(() => [PointTransactionResponse])
  transactions: PointTransactionResponse[];
}

@ObjectType()
export class RedeemRewardResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;

  @Field(() => Voucher, { nullable: true })
  voucher?: Voucher; // hoặc kiểu Voucher nếu bạn có entity Voucher
}