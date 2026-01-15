import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { Media } from './media.entity';
import { MediaService } from './media.service';
import { MediaInput } from './dto/media.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { PostService } from 'src/post/post.service';

@Resolver(() => Media)
export class MediaResolver {
  private readonly logger = new Logger(MediaResolver.name);

  constructor(
    private mediaService: MediaService,
    private postService: PostService,
  ) {}

  /**
   * Create a new media file for a post
   */
  @Mutation(() => Media)
  @UseGuards(GqlAuthGuard)
  async createMedia(
    @Args('postId', { type: () => ID }) postId: string,
    @Args('data') data: MediaInput,
    @CurrentUser() user: User,
  ): Promise<Media> {
    this.logger.log(`Creating media for post ${postId} by user ${user?.id}`);

    // Verify user owns the post
    const post = await this.postService.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    if (post.user?.id !== user?.id) {
      throw new Error('You are not authorized to add media to this post');
    }

    return this.mediaService.createMedia(postId, data);
  }

  /**
   * Get media by ID
   */
  @Query(() => Media, { nullable: true })
  async media(@Args('id', { type: () => ID }) id: string): Promise<Media | null> {
    this.logger.debug(`Fetching media ${id}`);
    return this.mediaService.getMediaById(id);
  }

  /**
   * Get all media for a post
   */
  @Query(() => [Media])
  async postMedia(@Args('postId', { type: () => ID }) postId: string): Promise<Media[]> {
    this.logger.debug(`Fetching media for post ${postId}`);
    return this.mediaService.getMediaByPostId(postId);
  }

  /**
   * Update media file
   */
  @Mutation(() => Media)
  @UseGuards(GqlAuthGuard)
  async updateMedia(
    @Args('id', { type: () => ID }) id: string,
    @Args('data') data: MediaInput,
    @CurrentUser() user: User,
  ): Promise<Media> {
    this.logger.log(`Updating media ${id} by user ${user?.id}`);

    // Get media and verify authorization
    const media = await this.mediaService.getMediaById(id);
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // Verify user owns the post
    if (media.post?.user?.id !== user?.id) {
      throw new Error('You are not authorized to update this media');
    }

    return this.mediaService.updateMedia(id, data);
  }

  /**
   * Delete media file
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteMedia(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    this.logger.log(`Deleting media ${id} by user ${user?.id}`);

    // Get media and verify authorization
    const media = await this.mediaService.getMediaById(id);
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // Verify user owns the post
    if (media.post?.user?.id !== user?.id) {
      throw new Error('You are not authorized to delete this media');
    }

    return this.mediaService.deleteMedia(id);
  }

  /**
   * Delete all media for a post
   */
  @Mutation(() => Int)
  @UseGuards(GqlAuthGuard)
  async deletePostMedia(
    @Args('postId', { type: () => ID }) postId: string,
    @CurrentUser() user: User,
  ): Promise<number> {
    this.logger.log(`Deleting all media for post ${postId} by user ${user?.id}`);

    // Verify user owns the post
    const post = await this.postService.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    if (post.user?.id !== user?.id) {
      throw new Error('You are not authorized to delete media from this post');
    }

    return this.mediaService.deleteMediaByPostId(postId);
  }

  /**
   * Get media count for a post
   */
  @Query(() => Int)
  async mediaCount(@Args('postId', { type: () => ID }) postId: string): Promise<number> {
    this.logger.debug(`Getting media count for post ${postId}`);
    return this.mediaService.getMediaCount(postId);
  }
}
