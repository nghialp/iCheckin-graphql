import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/post.entity';
import { Checkin } from 'src/checkin/checkin.entity';
import { Place } from 'src/place/place.entity';

@ObjectType()
export class LikeResponse {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  user: User;

  @Field(() => Post)
  post: Post;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class CheckinFavoriteResponse {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  user: User;

  @Field(() => Checkin)
  checkin: Checkin;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PlaceFavoriteResponse {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  user: User;

  @Field(() => Place)
  place: Place;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class UserFollowResponse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field()
  followersCount: number;

  @Field()
  followingCount: number;

  @Field()
  isFollowing: boolean;
}

@ObjectType()
export class PostStatsResponse {
  @Field(() => ID)
  postId: string;

  @Field()
  title: string;

  @Field()
  likeCount: number;

  @Field()
  commentCount: number;

  @Field({ nullable: true })
  isLikedByCurrentUser?: boolean;
}

@ObjectType()
export class FollowersListResponse {
  @Field(() => [UserFollowResponse])
  users: UserFollowResponse[];

  @Field()
  total: number;
}
