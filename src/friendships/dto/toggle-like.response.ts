import { ObjectType, Field, Int } from "@nestjs/graphql";

@ObjectType()
export class ToggleLikeResponse {
  @Field(() => Boolean)
  liked: boolean;

  @Field(() => Int)
  likeCount: number;
}

