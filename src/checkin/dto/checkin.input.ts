import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreateCheckinInput {
  @Field(() => ID)
  placeId: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  mood?: string;
}