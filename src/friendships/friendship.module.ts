import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Friendship } from "./friendship.entity";
import { Like } from "./like.entity";
import { CheckinFavorite } from "./checkin-favorite.entity";
import { PlaceFavorite } from "./place-favorite.entity";
import { User } from "src/user/entities/user.entity";
import { Post } from "src/post/post.entity";
import { Checkin } from "src/checkin/checkin.entity";
import { Place } from "src/place/place.entity";
import { CheckinLike } from "src/checkin/checkin-like.entity";
import { CheckinComment } from "src/checkin/checkin-comment.entity";
import { TripLike } from "src/trip/trip-like.entity";
import { TripComment } from "src/trip/trip-comment.entity";
import { Trip } from "src/trip/trip.entity";
import { FriendshipResolver } from "./friendship.resolver";
import { FriendshipService } from "./friendship.service";
import './friendship-status.graphql';

@Module({
  imports: [TypeOrmModule.forFeature([
    Friendship, Like, CheckinFavorite, PlaceFavorite, User, Post, Checkin, Place,
    CheckinLike, CheckinComment, TripLike, TripComment, Trip
  ])],
  providers: [FriendshipService, FriendshipResolver],
  exports: [FriendshipService],
})
export class FriendshipModule {}
