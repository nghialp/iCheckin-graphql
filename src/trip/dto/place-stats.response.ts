import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class PlaceStatsResponse {
  @Field()
  totalPlaces: number;

  @Field(() => Float)
  avgRating: number;

  @Field(() => [String])
  types: string[];
}
