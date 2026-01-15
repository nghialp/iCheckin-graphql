import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateRewardInput {
  @Field()
  type: string;

  @Field()
  description: string;

  @Field()
  required_points: number;

  @Field()
  stock: number;

  @Field({ nullable: true })
  partner?: string;
}
