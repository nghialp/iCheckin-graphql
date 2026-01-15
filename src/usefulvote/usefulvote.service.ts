import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsefulVote } from './usefulvote.entity';
import { Post } from 'src/post/post.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class UsefulVoteService {
  private readonly logger = new Logger(UsefulVoteService.name);

  constructor(
    @InjectRepository(UsefulVote)
    private usefulVoteRepository: Repository<UsefulVote>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Vote a post as useful
   */
  async voteUseful(postId: string, userId: string): Promise<UsefulVote> {
    this.logger.log(`User ${userId} voting post ${postId} as useful`);

    // Validate post exists
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user already voted
    const existingVote = await this.usefulVoteRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });

    if (existingVote) {
      throw new BadRequestException('You have already voted this post as useful');
    }

    // Create and save vote
    const vote = this.usefulVoteRepository.create({
      post,
      user,
      timestamp: new Date(),
    });

    const saved = await this.usefulVoteRepository.save(vote);
    this.logger.log(`Vote created with ID: ${saved.id}`);

    return saved;
  }

  /**
   * Remove vote from post
   */
  async removeVote(postId: string, userId: string): Promise<boolean> {
    this.logger.log(`User ${userId} removing vote from post ${postId}`);

    const vote = await this.usefulVoteRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    await this.usefulVoteRepository.remove(vote);
    this.logger.log(`Vote removed`);

    return true;
  }

  /**
   * Get vote by ID
   */
  async getVoteById(id: string): Promise<UsefulVote | null> {
    this.logger.debug(`Fetching vote with ID: ${id}`);

    return this.usefulVoteRepository.findOne({
      where: { id },
      relations: ['post', 'user'],
    });
  }

  /**
   * Get all votes for a post
   */
  async getVotesByPost(postId: string, limit: number = 50, offset: number = 0): Promise<{ votes: UsefulVote[]; total: number }> {
    this.logger.debug(`Fetching votes for post: ${postId}`);

    const [votes, total] = await this.usefulVoteRepository.findAndCount({
      where: { post: { id: postId } },
      relations: ['user'],
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { votes, total };
  }

  /**
   * Get all votes by a user
   */
  async getVotesByUser(userId: string, limit: number = 50, offset: number = 0): Promise<{ votes: UsefulVote[]; total: number }> {
    this.logger.debug(`Fetching votes by user: ${userId}`);

    const [votes, total] = await this.usefulVoteRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['post'],
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { votes, total };
  }

  /**
   * Check if user voted for a post
   */
  async hasUserVoted(postId: string, userId: string): Promise<boolean> {
    this.logger.debug(`Checking if user ${userId} voted for post ${postId}`);

    const vote = await this.usefulVoteRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });

    return !!vote;
  }

  /**
   * Get useful vote count for a post
   */
  async getVoteCountForPost(postId: string): Promise<number> {
    this.logger.debug(`Getting vote count for post: ${postId}`);

    return this.usefulVoteRepository.count({
      where: { post: { id: postId } },
    });
  }

  /**
   * Get total votes by a user
   */
  async getTotalVotesByUser(userId: string): Promise<number> {
    this.logger.debug(`Getting total votes by user: ${userId}`);

    return this.usefulVoteRepository.count({
      where: { user: { id: userId } },
    });
  }

  /**
   * Get most voted posts
   */
  async getMostVotedPosts(limit: number = 10): Promise<{ post: Post; voteCount: number }[]> {
    this.logger.debug(`Fetching most voted posts`);

    const results = await this.usefulVoteRepository
      .createQueryBuilder('vote')
      .select('vote.post_id', 'postId')
      .addSelect('COUNT(vote.id)', 'voteCount')
      .groupBy('vote.post_id')
      .orderBy('voteCount', 'DESC')
      .limit(limit)
      .getRawMany();

    // Fetch full post details
    const postsWithVotes = await Promise.all(
      results.map(async (result) => {
        const post = await this.postRepository.findOne({
          where: { id: result.postId },
        });
        return {
          post,
          voteCount: parseInt(result.voteCount, 10),
        };
      })
    );

    return postsWithVotes.filter((item): item is { post: Post; voteCount: number } => item.post !== null);
  }

  /**
   * Get most helpful users (who received most votes)
   */
  async getMostHelpfulUsers(limit: number = 10): Promise<{ user: User; voteCount: number }[]> {
    this.logger.debug(`Fetching most helpful users`);

    const results = await this.usefulVoteRepository
      .createQueryBuilder('vote')
      .innerJoin('vote.post', 'post')
      .select('post.user_id', 'userId')
      .addSelect('COUNT(vote.id)', 'voteCount')
      .groupBy('post.user_id')
      .orderBy('voteCount', 'DESC')
      .limit(limit)
      .getRawMany();

    // Fetch full user details
    const usersWithVotes = await Promise.all(
      results.map(async (result) => {
        const user = await this.userRepository.findOne({
          where: { id: result.userId },
        });
        return {
          user,
          voteCount: parseInt(result.voteCount, 10),
        };
      })
    );

    return usersWithVotes.filter((item): item is { user: User; voteCount: number } => item.user !== null);
  }

  /**
   * Delete all votes for a post (when post is deleted)
   */
  async deleteVotesByPost(postId: string): Promise<number> {
    this.logger.log(`Deleting all votes for post: ${postId}`);

    const result = await this.usefulVoteRepository.delete({
      post: { id: postId },
    });

    this.logger.log(`Deleted ${result.affected} votes for post ${postId}`);
    return result.affected || 0;
  }

  /**
   * Get useful votes for a user's posts
   */
  async getUserPostsVoteStats(userId: string): Promise<{ totalVotes: number; postsWithVotes: number }> {
    this.logger.debug(`Getting vote stats for user ${userId}'s posts`);

    const result = await this.usefulVoteRepository
      .createQueryBuilder('vote')
      .innerJoin('vote.post', 'post')
      .where('post.user_id = :userId', { userId })
      .select('COUNT(DISTINCT vote.post_id)', 'postsWithVotes')
      .addSelect('COUNT(vote.id)', 'totalVotes')
      .getRawOne();

    return {
      totalVotes: parseInt(result?.totalVotes || '0', 10),
      postsWithVotes: parseInt(result?.postsWithVotes || '0', 10),
    };
  }
}
