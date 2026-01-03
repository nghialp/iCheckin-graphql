import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreateCheckinInput {
  @Field(() => ID, { nullable: true })
  placeId?: string;

  @Field({ nullable: true })
  mapboxId?: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  mood?: string;
}

