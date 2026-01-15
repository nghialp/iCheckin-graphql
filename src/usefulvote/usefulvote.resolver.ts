import { Resolver, Query, Mutation, Args, ID, Int, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { UsefulVote } from './usefulvote.entity';
import { UsefulVoteService } from './usefulvote.service';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/post.entity';

// Response DTOs
@ObjectType()
export class VoteStats {
  @Field(() => Int)
  totalVotes: number;

  @Field(() => Int)
  postsWithVotes: number;
}

@ObjectType()
export class PostVoteData {
  @Field(() => Post)
  post: Post;

  @Field(() => Int)
  voteCount: number;
}

@ObjectType()
export class UserVoteData {
  @Field(() => User)
  user: User;

  @Field(() => Int)
  voteCount: number;
}

@Resolver(() => UsefulVote)
export class UsefulVoteResolver {
  private readonly logger = new Logger(UsefulVoteResolver.name);

  constructor(private usefulVoteService: UsefulVoteService) {}

  /**
   * Vote a post as useful
   */
  @Mutation(() => UsefulVote)
  @UseGuards(GqlAuthGuard)
  async voteUseful(
    @Args('postId', { type: () => ID }) postId: string,
    @CurrentUser() user: User,
  ): Promise<UsefulVote> {
    this.logger.log(`User ${user?.id} voting post ${postId} as useful`);

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    return this.usefulVoteService.voteUseful(postId, user.id);
  }

  /**
   * Remove vote from post
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async removeVote(
    @Args('postId', { type: () => ID }) postId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    this.logger.log(`User ${user?.id} removing vote from post ${postId}`);

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    return this.usefulVoteService.removeVote(postId, user.id);
  }

  /**
   * Get useful vote count for a post
   */
  @Query(() => Int)
  async postVoteCount(@Args('postId', { type: () => ID }) postId: string): Promise<number> {
    this.logger.debug(`Getting vote count for post ${postId}`);
    return this.usefulVoteService.getVoteCountForPost(postId);
  }

  /**
   * Check if user voted for a post
   */
  @Query(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async hasUserVoted(
    @Args('postId', { type: () => ID }) postId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    this.logger.debug(`Checking if user ${user?.id} voted for post ${postId}`);

    if (!user?.id) {
      return false;
    }

    return this.usefulVoteService.hasUserVoted(postId, user.id);
  }

  /**
   * Get all votes for a post
   */
  @Query(() => [UsefulVote])
  async postVotes(
    @Args('postId', { type: () => ID }) postId: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<UsefulVote[]> {
    this.logger.debug(`Fetching votes for post ${postId}`);
    const { votes } = await this.usefulVoteService.getVotesByPost(postId, limit, offset);
    return votes;
  }

  /**
   * Get all votes by a user
   */
  @Query(() => [UsefulVote])
  async userVotes(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<UsefulVote[]> {
    this.logger.debug(`Fetching votes by user ${userId}`);
    const { votes } = await this.usefulVoteService.getVotesByUser(userId, limit, offset);
    return votes;
  }

  /**
   * Get vote count by user
   */
  @Query(() => Int)
  async userVoteCount(@Args('userId', { type: () => ID }) userId: string): Promise<number> {
    this.logger.debug(`Getting vote count by user ${userId}`);
    return this.usefulVoteService.getTotalVotesByUser(userId);
  }

  /**
   * Get most voted posts
   */
  @Query(() => [PostVoteData])
  async mostVotedPosts(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<PostVoteData[]> {
    this.logger.debug(`Fetching most voted posts`);
    return this.usefulVoteService.getMostVotedPosts(limit);
  }

  /**
   * Get most helpful users
   */
  @Query(() => [UserVoteData])
  async mostHelpfulUsers(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<UserVoteData[]> {
    this.logger.debug(`Fetching most helpful users`);
    return this.usefulVoteService.getMostHelpfulUsers(limit);
  }

  /**
   * Get vote stats for a user's posts
   */
  @Query(() => VoteStats)
  async userPostsVoteStats(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<VoteStats> {
    this.logger.debug(`Getting vote stats for user ${userId}'s posts`);
    return this.usefulVoteService.getUserPostsVoteStats(userId);
  }

  /**
   * Get current user's vote stats
   */
  @Query(() => VoteStats)
  @UseGuards(GqlAuthGuard)
  async myPostsVoteStats(@CurrentUser() user: User): Promise<VoteStats> {
    this.logger.debug(`Getting vote stats for user ${user?.id}'s posts`);

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    return this.usefulVoteService.getUserPostsVoteStats(user.id);
  }
}
