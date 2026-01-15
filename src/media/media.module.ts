import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './media.entity';
import { Post } from 'src/post/post.entity';
import { MediaService } from './media.service';
import { MediaResolver } from './media.resolver';
import { PostModule } from 'src/post/post.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, Post]),
    PostModule
  ],
  providers: [MediaService, MediaResolver],
  exports: [MediaService],
})
export class MediaModule {}
