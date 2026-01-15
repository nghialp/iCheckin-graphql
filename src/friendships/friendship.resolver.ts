import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
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
import { UseGuards } from "@nestjs/common";
import { GqlAuthGuard } from "src/auth/guards/gql-auth.guard";

@Resolver()
export class FriendshipResolver {
    constructor(private friendshipService: FriendshipService) {}

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
}