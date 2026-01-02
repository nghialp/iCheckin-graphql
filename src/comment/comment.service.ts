import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Post } from "src/post/post.entity";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { Comment } from "./comment.entity";

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    @InjectRepository(Comment)
    private commentRepo: Repository<Comment>,
  ) { }

  async createComment(user: User, post: Post, content: string): Promise<Comment> {
    this.logger.log(`Creating comment for post ${post.id} by user ${user.id}`);
    
    const comment = this.commentRepo.create({
      user,
      post,
      content,
      createdAt: new Date(),
    });
    
    const saved = await this.commentRepo.save(comment);
    this.logger.log(`Comment created successfully: ${saved.id}`);
    
    return saved;
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    this.logger.log(`Fetching comments for post: ${postId}`);
    
    return this.commentRepo.find({
      where: { post: { id: postId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCommentById(id: string): Promise<Comment | null> {
    return this.commentRepo.findOne({
      where: { id },
      relations: ['user', 'post'],
    });
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    this.logger.log(`Deleting comment ${id} for user ${userId}`);
    
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      this.logger.warn(`Comment not found: ${id}`);
      return false;
    }

    if (comment.user.id !== userId) {
      this.logger.warn(`User ${userId} attempted to delete comment ${id} owned by ${comment.user.id}`);
      throw new Error('Bạn không có quyền xóa bình luận này');
    }

    await this.commentRepo.remove(comment);
    this.logger.log(`Comment ${id} deleted successfully`);
    
    return true;
  }

  async updateComment(id: string, userId: string, content: string): Promise<Comment> {
    this.logger.log(`Updating comment ${id} for user ${userId}`);
    
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      throw new Error('Bình luận không tồn tại');
    }

    if (comment.user.id !== userId) {
      throw new Error('Bạn không có quyền chỉnh sửa bình luận này');
    }

    comment.content = content;
    return this.commentRepo.save(comment);
  }
}
