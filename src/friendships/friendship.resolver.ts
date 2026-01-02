import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { FriendshipService } from "./friendship.service";
import { Friendship } from "./friendship.entity";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { User } from "src/user/entities/user.entity";

@Resolver()
export class FriendshipResolver {
    constructor(private friendshipService: FriendshipService) {}

    @Mutation(() => Friendship)
    sendFriendRequest(@Args('toUserId') toUserId: string, @CurrentUser() user: User): Promise<Friendship> {
        return this.friendshipService.sendRequest(user.id, toUserId);
    }

    @Mutation(() => Friendship)
    acceptFriendRequest(@Args('requestId') requestId: string, @CurrentUser() user: User): Promise<Friendship> {
        return this.friendshipService.acceptRequest(requestId, user.id);
    }

    @Mutation(() => Boolean)
    unfriend(@Args('friendId') friendId: string, @CurrentUser() user: User): Promise<boolean> {
        return this.friendshipService.unfriend(user.id, friendId).then(() => true);
    }

    @Query(() => [User])
    async myFriends(@CurrentUser() user: User): Promise<User[]> {
        return this.friendshipService.getFriends(user.id);
    }
}