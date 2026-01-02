import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommentService } from "./comment.service";
import { CommentResolver } from "./comment.resolver";
import { Comment } from "./comment.entity";
import { PostModule } from "src/post/post.module";

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), PostModule],
  providers: [CommentService, CommentResolver],
  exports: [CommentService],
})
export class CommentModule {}