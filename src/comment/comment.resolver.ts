import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { GqlAuthGuard } from "src/auth/guards/gql-auth.guard";
import { CommentService } from "./comment.service";
import { User } from "src/user/entities/user.entity";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { PostService } from "src/post/post.service";
import { Comment } from "./comment.entity";

@Resolver(() => Comment)
export class CommentResolver {
    constructor(
        private commentService: CommentService,
        private postService: PostService,
    ) { }

    @Query(() => [Comment])
    async getPostComments(@Args('postId') postId: string): Promise<Comment[]> {
        return this.commentService.getPostComments(postId);
    }

    @Query(() => Comment, { nullable: true })
    async getComment(@Args('id') id: string): Promise<Comment | null> {
        return this.commentService.getCommentById(id);
    }

    @Mutation(() => Comment)
    @UseGuards(GqlAuthGuard)
    async createComment(
        @Args('postId') postId: string,
        @Args('content') content: string,
        @CurrentUser() user: User
    ) {
        const post = await this.postService.findOneBy({ id: postId });
        if (!post) {
            throw new Error('Post not found');
        }
        return this.commentService.createComment(user, post, content);
    }

    @Mutation(() => Comment)
    @UseGuards(GqlAuthGuard)
    async updateComment(
        @Args('id') id: string,
        @Args('content') content: string,
        @CurrentUser() user: User
    ) {
        return this.commentService.updateComment(id, user.id, content);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    async deleteComment(
        @Args('id') id: string,
        @CurrentUser() user: User
    ) {
        return this.commentService.deleteComment(id, user.id);
    }
}

