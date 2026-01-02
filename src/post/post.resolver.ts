import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { CreatePostInput } from './dto/post.input';
import { Post } from './post.entity';
import { PostService } from './post.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  @Mutation(() => Post)
  async createPost(@Args('input') input: CreatePostInput, @CurrentUser() user: any): Promise<Post> {
    return this.postService.createPost(input, user);
  }

    @Query(() => Post, { nullable: true })
    async getPost(@Args('id') id: string): Promise<Post | null> {
        return this.postService.findOneBy({ id });
    }
}