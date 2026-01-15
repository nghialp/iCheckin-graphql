import { InputType, Field, ID, ObjectType, Int } from '@nestjs/graphql';

@InputType()
export class RedeemRewardInput {
  @Field(() => ID)
  rewardId: string;
}

@ObjectType()
export class RedemptionEligibility {
  @Field(() => Boolean)
  eligible: boolean;

  @Field(() => String, { nullable: true })
  reason?: string;

  @Field(() => Int, { nullable: true })
  pointsNeeded?: number;
}

@ObjectType()
export class RewardStats {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  available: number;

  @Field(() => Int)
  outOfStock: number;

  @Field(() => Int)
  expired: number;
}
