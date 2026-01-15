import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Reward } from 'src/reward/reward.entity';

@InputType()
export class RedeemRewardInput {
  @Field()
  rewardId: string;
}

@ObjectType()
export class RedeemRewardResponse {
  @Field()
  voucherId: string;

  @Field()
  voucherCode: string;

  @Field()
  qrCode: string;

  @Field()
  rewardTitle: string;

  @Field()
  pointsDeducted: number;

  @Field()
  remainingPoints: number;

  @Field()
  expiryDate?: Date;

  @Field()
  message: string;
}

@ObjectType()
export class VoucherDetailsResponse {
  @Field()
  id: string;

  @Field()
  voucher_code: string;

  @Field()
  qr_code: string;

  @Field(() => Reward)
  reward: Reward;

  @Field(() => User)
  user: User;

  @Field()
  status: string;

  @Field()
  redeem_date: Date;

  @Field({ nullable: true })
  used_date?: Date;

  @Field({ nullable: true })
  expiry_date?: Date;
}
