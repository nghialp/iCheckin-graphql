import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateTripInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  start_date: Date;

  @Field()
  end_date: Date;

  @Field(() => [String], { nullable: true })
  locations?: string[];

  @Field({ nullable: true })
  status?: string;
}
