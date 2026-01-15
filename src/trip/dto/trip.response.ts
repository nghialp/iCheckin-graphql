import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/post.entity';

@ObjectType()
export class TripResponse {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  user: User;

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

  @Field(() => [Post], { nullable: true })
  posts?: Post[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class TripStatsResponse {
  @Field(() => ID)
  tripId: string;

  @Field()
  title: string;

  @Field()
  postsCount: number;

  @Field()
  locationsCount: number;

  @Field()
  durationDays: number;

  @Field()
  averageCost: number;

  @Field()
  averageRating: number;
}

@ObjectType()
export class TripPaginatedResponse {
  @Field(() => [TripResponse])
  trips: TripResponse[];

  @Field()
  total: number;

  @Field()
  page: number;

  @Field()
  limit: number;

  @Field()
  totalPages: number;
}
