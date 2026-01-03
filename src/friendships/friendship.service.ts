import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Friendship } from "./friendship.entity";
import { FriendshipStatus } from "./friendship-status.enum";
import { User } from "src/user/entities/user.entity";

// Error messages (English only)
const ERROR_MESSAGES = {
  CANNOT_SELF_FRIEND: 'Cannot send friend request to yourself',
  REQUEST_ALREADY_EXISTS: 'Friend request already sent',
  ALREADY_FRIENDS: 'Users are already friends',
  REQUEST_NOT_FOUND: 'Friend request not found',
  REQUEST_ALREADY_PROCESSED: 'Friend request already processed',
  UNAUTHORIZED_ACCEPT: 'You do not have permission to accept this friend request',
  UNAUTHORIZED_REJECT: 'You do not have permission to reject this friend request',
  NOT_FRIENDS: 'Users are not friends',
} as const;

@Injectable()
export class FriendshipService {
  private readonly logger = new Logger(FriendshipService.name);

  constructor(
    @InjectRepository(Friendship)
    private friendshipRepo: Repository<Friendship>,
    private dataSource: DataSource,
  ) {}

  /**
   * Send friend request with transaction
   */
  async sendRequest(fromId: string, toId: string): Promise<Friendship> {
    this.logger.log(`User ${fromId} sending friend request to ${toId}`);

    // Validation: cannot friend request self
    if (fromId === toId) {
      this.logger.warn(`User ${fromId} attempted to send request to self`);
      throw new Error(ERROR_MESSAGES.CANNOT_SELF_FRIEND);
    }

    // Use transaction for atomic operation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check for existing request
      const existing = await this.friendshipRepo.findOne({
        where: { requester: { id: fromId }, recipient: { id: toId } },
        relations: ['requester', 'recipient'],
      });
      if (existing) {
        this.logger.warn(`Request already exists from ${fromId} to ${toId}`);
        throw new Error(ERROR_MESSAGES.REQUEST_ALREADY_EXISTS);
      }

      // Check if already friends
      const alreadyFriends = await this.friendshipRepo.findOne({
        where: [
          { requester: { id: fromId }, recipient: { id: toId }, status: FriendshipStatus.ACCEPTED },
          { requester: { id: toId }, recipient: { id: fromId }, status: FriendshipStatus.ACCEPTED },
        ],
      });
      if (alreadyFriends) {
        this.logger.warn(`Users ${fromId} and ${toId} are already friends`);
        throw new Error(ERROR_MESSAGES.ALREADY_FRIENDS);
      }

      const request = this.friendshipRepo.create({
        requester: { id: fromId },
        recipient: { id: toId },
        status: FriendshipStatus.PENDING,
      });
      
      const saved = await queryRunner.manager.save(request);
      await queryRunner.commitTransaction();
      
      this.logger.log(`Friend request sent: ${saved.id}`);
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Accept friend request with transaction
   */
  async acceptRequest(requestId: string, userId: string): Promise<Friendship> {
    this.logger.log(`User ${userId} accepting request ${requestId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await this.friendshipRepo.findOne({
        where: { id: requestId },
        relations: ['requester', 'recipient'],
      });
      if (!request) {
        this.logger.warn(`Friend request not found: ${requestId}`);
        throw new Error(ERROR_MESSAGES.REQUEST_NOT_FOUND);
      }
      
      if (request.status !== FriendshipStatus.PENDING) {
        this.logger.warn(`Request ${requestId} already processed with status: ${request.status}`);
        throw new Error(ERROR_MESSAGES.REQUEST_ALREADY_PROCESSED);
      }
      
      // Validation: only recipient can accept
      if (request.recipient.id !== userId) {
        this.logger.warn(`User ${userId} attempted to accept request ${requestId} not addressed to them`);
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED_ACCEPT);
      }
      
      request.status = FriendshipStatus.ACCEPTED;
      const saved = await queryRunner.manager.save(request);
      await queryRunner.commitTransaction();
      
      this.logger.log(`Friend request ${requestId} accepted`);
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reject friend request
   */
  async rejectRequest(requestId: string, userId: string): Promise<Friendship> {
    this.logger.log(`User ${userId} rejecting request ${requestId}`);

    const request = await this.friendshipRepo.findOne({
      where: { id: requestId },
      relations: ['requester', 'recipient'],
    });
    if (!request) {
      throw new Error(ERROR_MESSAGES.REQUEST_NOT_FOUND);
    }
    
    if (request.status !== FriendshipStatus.PENDING) {
      throw new Error(ERROR_MESSAGES.REQUEST_ALREADY_PROCESSED);
    }
    
    if (request.recipient.id !== userId) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED_REJECT);
    }
    
    request.status = FriendshipStatus.REJECTED;
    return this.friendshipRepo.save(request);
  }

  /**
   * Unfriend user
   */
  async unfriend(userId: string, friendId: string): Promise<Friendship> {
    this.logger.log(`User ${userId} unfriending ${friendId}`);

    const relation = await this.friendshipRepo.findOne({
      where: [
        { requester: { id: userId }, recipient: { id: friendId }, status: FriendshipStatus.ACCEPTED },
        { requester: { id: friendId }, recipient: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
    });
    if (!relation) {
      this.logger.warn(`No friendship found between ${userId} and ${friendId}`);
      throw new Error(ERROR_MESSAGES.NOT_FRIENDS);
    }
    
    await this.friendshipRepo.remove(relation);
    this.logger.log(`Friendship between ${userId} and ${friendId} removed`);
    
    return relation;
  }

  /**
   * Get user's friends with pagination
   */
  async getFriends(userId: string, page: number = 1, limit: number = 10): Promise<User[]> {
    this.logger.log(`Fetching friends for user: ${userId}`);

    const validLimit = Math.min(limit, 100);
    const skip = (page - 1) * validLimit;

    const accepted = await this.friendshipRepo.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { recipient: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'recipient'],
      take: validLimit,
      skip,
    });

    const friends = accepted.map(f =>
      f.requester.id === userId ? f.recipient : f.requester,
    );

    this.logger.log(`Found ${friends.length} friends for user ${userId}`);
    return friends;
  }

  /**
   * Get pending friend requests received
   */
  async getPendingRequests(userId: string): Promise<Friendship[]> {
    return this.friendshipRepo.find({
      where: { recipient: { id: userId }, status: FriendshipStatus.PENDING },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Check friendship status between 2 users
   */
  async getFriendshipStatus(userId1: string, userId2: string): Promise<FriendshipStatus | null> {
    const relation = await this.friendshipRepo.findOne({
      where: [
        { requester: { id: userId1 }, recipient: { id: userId2 } },
        { requester: { id: userId2 }, recipient: { id: userId1 } },
      ],
    });
    
    return relation?.status || null;
  }
}
