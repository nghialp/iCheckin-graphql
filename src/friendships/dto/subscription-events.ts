import { ObjectType, Field, ID, Int } from "@nestjs/graphql";
import { CheckinLike } from "src/checkin/checkin-like.entity";
import { CheckinComment } from "src/checkin/checkin-comment.entity";
import { TripLike } from "src/trip/trip-like.entity";
import { TripComment } from "src/trip/trip-comment.entity";
import { Like } from "../like.entity";

@ObjectType()
export class CheckinLikeEvent {
  @Field(() => ID)
  checkinId: string;

  @Field(() => CheckinLike)
  like: CheckinLike;

  @Field(() => Int)
  likeCount: number;
}

@ObjectType()
export class CheckinCommentEvent {
  @Field(() => ID)
  checkinId: string;

  @Field(() => CheckinComment)
  comment: CheckinComment;
}

@ObjectType()
export class TripLikeEvent {
  @Field(() => ID)
  tripId: string;

  @Field(() => TripLike)
  like: TripLike;

  @Field(() => Int)
  likeCount: number;
}

@ObjectType()
export class TripCommentEvent {
  @Field(() => ID)
  tripId: string;

  @Field(() => TripComment)
  comment: TripComment;
}

@ObjectType()
export class PostLikeEvent {
  @Field(() => ID)
  postId: string;

  @Field(() => Like)
  like: Like;

  @Field(() => Int)
  likeCount: number;
}

