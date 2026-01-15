import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { CreateTripInput } from './create-trip.input';

@InputType()
export class UpdateTripInput extends PartialType(CreateTripInput) {
  @Field(() => ID)
  id: string;
}
