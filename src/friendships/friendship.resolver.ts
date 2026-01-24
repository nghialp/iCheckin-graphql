import { Args, Mutation, Query, Resolver, Subscription } from "@nestjs/graphql";
import { FriendshipService } from "./friendship.service";
import { Friendship } from "./friendship.entity";
import { Like } from "./like.entity";
import { CheckinFavorite } from "./checkin-favorite.entity";
import { PlaceFavorite } from "./place-favorite.entity";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { User } from "src/user/entities/user.entity";
import { Post } from "src/post/post.entity";
import { Checkin } from "src/checkin/checkin.entity";
import { Place } from "src/place/place.entity";
import { CheckinLike } from "src/checkin/checkin-like.entity";
import { CheckinComment } from "src/checkin/checkin-comment.entity";
import { TripLike } from "src/trip/trip-like.entity";
import { TripComment } from "src/trip/trip-comment.entity";
import { ToggleLikeResponse } from "./dto/toggle-like.response";
import { UseGuards } from "@nestjs/common";
import { GqlAuthGuard } from "src/auth/guards/gql-auth.guard";
import { PubSub } from "graphql-subscriptions";
import { PUB_SUB } from "src/common/services/pub-sub.service";
import { Inject } from "@nestjs/common";
import {
  CheckinLikeEvent,
  CheckinCommentEvent,
  TripLikeEvent,
  TripCommentEvent,
  PostLikeEvent,
} from "./dto/subscription-events";

@Resolver()
export class FriendshipResolver {
    private pubSubInstance: PubSub;

    constructor(
        private friendshipService: FriendshipService,
        @Inject(PUB_SUB) private pubSub: PubSub,
    ) {
        this.pubSubInstance = pubSub;
    }

    @Mutation(() => Friendship)
    @UseGuards(GqlAuthGuard)
    sendFriendRequest(@Args('toUserId') toUserId: string, @CurrentUser() user: User): Promise<Friendship> {
        return this.friendshipService.sendRequest(user.id, toUserId);
    }

    @Mutation(() => Friendship)
    @UseGuards(GqlAuthGuard)
    acceptFriendRequest(@Args('requestId') requestId: string, @CurrentUser() user: User): Promise<Friendship> {
        return this.friendshipService.acceptRequest(requestId, user.id);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    unfriend(@Args('friendId') friendId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.unfriend(user.id, friendId).then(() => true);
    }

    @Query(() => [User])
    @UseGuards(GqlAuthGuard)
    async myFriends(@CurrentUser() user: User): Promise<User[]> {
        return this.friendshipService.getFriends(user.id);
    }

    // ==================== Follow System ====================

    @Mutation(() => User)
    @UseGuards(GqlAuthGuard)
    followUser(@Args('userId') userId: string, @CurrentUser() user: User): Promise<User> {
        return this.friendshipService.followUser(user.id, userId);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    unfollowUser(@Args('userId') userId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.unfollowUser(user.id, userId);
    }

    @Query(() => [User])
    @UseGuards(GqlAuthGuard)
    getFollowers(@Args('userId') userId: string): Promise<User[]> {
        return this.friendshipService.getFollowers(userId);
    }

    @Query(() => [User])
    @UseGuards(GqlAuthGuard)
    getFollowings(@Args('userId') userId: string): Promise<User[]> {
        return this.friendshipService.getFollowings(userId);
    }

    @Query(() => Boolean)
    @UseGuards(GqlAuthGuard)
    isFollowing(@Args('userId') userId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.isFollowing(user.id, userId);
    }

    // ==================== Like Post System ====================

    @Mutation(() => Like)
    @UseGuards(GqlAuthGuard)
    likePost(@Args('postId') postId: string, @CurrentUser() user: User): Promise<Like> {
        return this.friendshipService.likePost(user.id, postId);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    unlikePost(@Args('postId') postId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.unlikePost(user.id, postId);
    }

    @Query(() => [Like])
    @UseGuards(GqlAuthGuard)
    getPostLikes(@Args('postId') postId: string): Promise<Like[]> {
        return this.friendshipService.getPostLikes(postId);
    }

    @Query(() => Boolean)
    @UseGuards(GqlAuthGuard)
    hasUserLikedPost(@Args('postId') postId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.hasUserLikedPost(user.id, postId);
    }

    @Query(() => Number)
    @UseGuards(GqlAuthGuard)
    getPostLikeCount(@Args('postId') postId: string): Promise<number> {
        return this.friendshipService.getPostLikeCount(postId);
    }

    @Query(() => [Post])
    @UseGuards(GqlAuthGuard)
    getUserLikedPosts(@Args('userId') userId: string): Promise<Post[]> {
        return this.friendshipService.getUserLikedPosts(userId);
    }

    // ==================== Checkin Favorites ====================

    @Mutation(() => CheckinFavorite)
    @UseGuards(GqlAuthGuard)
    addCheckinFavorite(@Args('checkinId') checkinId: string, @CurrentUser() user: User): Promise<CheckinFavorite> {
        return this.friendshipService.addCheckinFavorite(user.id, checkinId);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    removeCheckinFavorite(@Args('checkinId') checkinId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.removeCheckinFavorite(user.id, checkinId);
    }

    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    getUserFavoriteCheckins(@Args('userId') userId: string): Promise<Checkin[]> {
        return this.friendshipService.getUserFavoriteCheckins(userId);
    }

    @Query(() => Boolean)
    @UseGuards(GqlAuthGuard)
    isCheckinFavorited(@Args('checkinId') checkinId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.isCheckinFavorited(user.id, checkinId);
    }

    // ==================== Place Favorites ====================

    @Mutation(() => PlaceFavorite)
    @UseGuards(GqlAuthGuard)
    addPlaceFavorite(@Args('placeId') placeId: string, @CurrentUser() user: User): Promise<PlaceFavorite> {
        return this.friendshipService.addPlaceFavorite(user.id, placeId);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    removePlaceFavorite(@Args('placeId') placeId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.removePlaceFavorite(user.id, placeId);
    }

    @Query(() => [Place])
    @UseGuards(GqlAuthGuard)
    getUserFavoritePlaces(@Args('userId') userId: string): Promise<Place[]> {
        return this.friendshipService.getUserFavoritePlaces(userId);
    }

    @Query(() => Boolean)
    @UseGuards(GqlAuthGuard)
    isPlaceFavorited(@Args('placeId') placeId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.isPlaceFavorited(user.id, placeId);
    }

    @Query(() => Number)
    @UseGuards(GqlAuthGuard)
    getPlaceFavoriteCount(@Args('placeId') placeId: string): Promise<number> {
        return this.friendshipService.getPlaceFavoriteCount(placeId);
    }

    // ==================== Checkin Like System (Toggle) ====================

    @Mutation(() => ToggleLikeResponse)
    @UseGuards(GqlAuthGuard)
    toggleLikeCheckin(@Args('checkinId') checkinId: string, @CurrentUser() user: User): Promise<ToggleLikeResponse> {
        return this.friendshipService.toggleLikeCheckin(user.id, checkinId);
    }

    @Query(() => [CheckinLike])
    @UseGuards(GqlAuthGuard)
    getCheckinLikes(@Args('checkinId') checkinId: string): Promise<CheckinLike[]> {
        return this.friendshipService.getCheckinLikes(checkinId);
    }

    @Query(() => Boolean)
    @UseGuards(GqlAuthGuard)
    hasUserLikedCheckin(@Args('checkinId') checkinId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.hasUserLikedCheckin(user.id, checkinId);
    }

    @Query(() => Number)
    @UseGuards(GqlAuthGuard)
    getCheckinLikeCount(@Args('checkinId') checkinId: string): Promise<number> {
        return this.friendshipService.getCheckinLikeCount(checkinId);
    }

    // ==================== Checkin Comment System ====================

    @Mutation(() => CheckinComment)
    @UseGuards(GqlAuthGuard)
    createCheckinComment(
        @Args('checkinId') checkinId: string,
        @Args('content') content: string,
        @Args('parentId', { nullable: true }) parentId: string,
        @CurrentUser() user: User,
    ): Promise<CheckinComment> {
        return this.friendshipService.createCheckinComment(user.id, checkinId, content, parentId);
    }

    @Query(() => [CheckinComment])
    @UseGuards(GqlAuthGuard)
    getCheckinComments(@Args('checkinId') checkinId: string): Promise<CheckinComment[]> {
        return this.friendshipService.getCheckinComments(checkinId);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    deleteCheckinComment(@Args('commentId') commentId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.deleteCheckinComment(commentId, user.id);
    }

    // ==================== Trip Like System (Toggle) ====================

    @Mutation(() => ToggleLikeResponse)
    @UseGuards(GqlAuthGuard)
    toggleLikeTrip(@Args('tripId') tripId: string, @CurrentUser() user: User): Promise<ToggleLikeResponse> {
        return this.friendshipService.toggleLikeTrip(user.id, tripId);
    }

    @Query(() => [TripLike])
    @UseGuards(GqlAuthGuard)
    getTripLikes(@Args('tripId') tripId: string): Promise<TripLike[]> {
        return this.friendshipService.getTripLikes(tripId);
    }

    @Query(() => Boolean)
    @UseGuards(GqlAuthGuard)
    hasUserLikedTrip(@Args('tripId') tripId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.hasUserLikedTrip(user.id, tripId);
    }

    @Query(() => Number)
    @UseGuards(GqlAuthGuard)
    getTripLikeCount(@Args('tripId') tripId: string): Promise<number> {
        return this.friendshipService.getTripLikeCount(tripId);
    }

    // ==================== Trip Comment System ====================

    @Mutation(() => TripComment)
    @UseGuards(GqlAuthGuard)
    createTripComment(
        @Args('tripId') tripId: string,
        @Args('content') content: string,
        @Args('parentId', { nullable: true }) parentId: string,
        @CurrentUser() user: User,
    ): Promise<TripComment> {
        return this.friendshipService.createTripComment(user.id, tripId, content, parentId);
    }

    @Query(() => [TripComment])
    @UseGuards(GqlAuthGuard)
    getTripComments(@Args('tripId') tripId: string): Promise<TripComment[]> {
        return this.friendshipService.getTripComments(tripId);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    deleteTripComment(@Args('commentId') commentId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.deleteTripComment(commentId, user.id);
    }

    // ==================== Subscriptions ====================

    @Subscription(() => CheckinLikeEvent, {
        filter: (payload, variables) => {
            return payload.checkinLiked.checkinId === variables.checkinId;
        },
    })
    checkinLiked(@Args('checkinId') checkinId: string) {
        return (this.pubSubInstance as any).asyncIterator('checkinLiked');
    }

    @Subscription(() => CheckinCommentEvent, {
        filter: (payload, variables) => {
            return payload.checkinCommented.checkinId === variables.checkinId;
        },
    })
    checkinCommented(@Args('checkinId') checkinId: string) {
        return (this.pubSubInstance as any).asyncIterator('checkinCommented');
    }

    @Subscription(() => TripLikeEvent, {
        filter: (payload, variables) => {
            return payload.tripLiked.tripId === variables.tripId;
        },
    })
    tripLiked(@Args('tripId') tripId: string) {
        return (this.pubSubInstance as any).asyncIterator('tripLiked');
    }

    @Subscription(() => TripCommentEvent, {
        filter: (payload, variables) => {
            return payload.tripCommented.tripId === variables.tripId;
        },
    })
    tripCommented(@Args('tripId') tripId: string) {
        return (this.pubSubInstance as any).asyncIterator('tripCommented');
    }

    @Subscription(() => PostLikeEvent, {
        filter: (payload, variables) => {
            return payload.postLiked.postId === variables.postId;
        },
    })
    postLiked(@Args('postId') postId: string) {
        return (this.pubSubInstance as any).asyncIterator('postLiked');
    }
}

