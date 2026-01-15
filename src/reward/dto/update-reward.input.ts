import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateRewardInput {
  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  required_points?: number;

  @Field({ nullable: true })
  stock?: number;

  @Field({ nullable: true })
  partner?: string;
}
