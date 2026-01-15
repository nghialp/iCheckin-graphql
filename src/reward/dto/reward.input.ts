import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateRewardInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  category: string;

  @Field()
  points_required: number;

  @Field()
  image_url: string;

  @Field({ nullable: true })
  stock?: number;

  @Field({ nullable: true })
  expiry_date?: Date;

  @Field({ nullable: true })
  partner_id?: string;
}

@InputType()
export class UpdateRewardInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  stock?: number;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  expiry_date?: Date;
}
