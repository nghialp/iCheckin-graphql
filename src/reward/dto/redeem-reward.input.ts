import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class RedeemRewardInput {
  @Field(() => ID)
  rewardId: string;
}