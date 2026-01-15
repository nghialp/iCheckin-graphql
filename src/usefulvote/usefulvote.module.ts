import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsefulVote } from './usefulvote.entity';
import { UsefulVoteService } from './usefulvote.service';
import { UsefulVoteResolver } from './usefulvote.resolver';
import { Post } from 'src/post/post.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsefulVote, Post, User]),
  ],
  providers: [UsefulVoteService, UsefulVoteResolver],
  exports: [UsefulVoteService],
})
export class UsefulVoteModule {}
