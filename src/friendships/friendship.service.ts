import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Friendship } from "./friendship.entity";
import { Repository } from "typeorm";
import { FriendshipStatus } from "./friendship-status.enum";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class FriendshipService {
  private readonly logger = new Logger(FriendshipService.name);

  constructor(
    @InjectRepository(Friendship)
    private friendshipRepo: Repository<Friendship>,
  ) {}

  /**
   * Gửi lời mời kết bạn
   */
  async sendRequest(fromId: string, toId: string): Promise<Friendship> {
    this.logger.log(`User ${fromId} sending friend request to ${toId}`);

    // Validation: không thể tự kết bạn với mình
    if (fromId === toId) {
      this.logger.warn(`User ${fromId} attempted to send request to self`);
      throw new Error('Không thể tự gửi lời mời kết bạn với bản thân');
    }

    // Kiểm tra đã gửi request trước đó chưa
    const existing = await this.friendshipRepo.findOne({
      where: { requester: { id: fromId }, recipient: { id: toId } },
      relations: ['requester', 'recipient'],
    });
    if (existing) {
      this.logger.warn(`Request already exists from ${fromId} to ${toId}`);
      throw new Error('Đã gửi lời mời');
    }

    // Kiểm tra đã là bạn bè chưa
    const alreadyFriends = await this.friendshipRepo.findOne({
      where: [
        { requester: { id: fromId }, recipient: { id: toId }, status: FriendshipStatus.ACCEPTED },
        { requester: { id: toId }, recipient: { id: fromId }, status: FriendshipStatus.ACCEPTED },
      ],
    });
    if (alreadyFriends) {
      this.logger.warn(`Users ${fromId} and ${toId} are already friends`);
      throw new Error('Hai người đã là bạn bè');
    }

    const request = this.friendshipRepo.create({
      requester: { id: fromId },
      recipient: { id: toId },
      status: FriendshipStatus.PENDING,
    });
    
    const saved = await this.friendshipRepo.save(request);
    this.logger.log(`Friend request sent: ${saved.id}`);
    
    return saved;
  }

  /**
   * Chấp nhận lời mời kết bạn
   */
  async acceptRequest(requestId: string, userId: string): Promise<Friendship> {
    this.logger.log(`User ${userId} accepting request ${requestId}`);

    const request = await this.friendshipRepo.findOne({
      where: { id: requestId },
      relations: ['requester', 'recipient'],
    });
    if (!request) {
      this.logger.warn(`Friend request not found: ${requestId}`);
      throw new Error('Không tìm thấy lời mời');
    }
    
    if (request.status !== FriendshipStatus.PENDING) {
      this.logger.warn(`Request ${requestId} already processed with status: ${request.status}`);
      throw new Error('Lời mời đã được xử lý');
    }
    
    // Validation: chỉ recipient mới có thể chấp nhận
    if (request.recipient.id !== userId) {
      this.logger.warn(`User ${userId} attempted to accept request ${requestId} not addressed to them`);
      throw new Error('Bạn không có quyền chấp nhận lời mời này');
    }
    
    request.status = FriendshipStatus.ACCEPTED;
    const saved = await this.friendshipRepo.save(request);
    this.logger.log(`Friend request ${requestId} accepted`);
    
    return saved;
  }

  /**
   * Từ chối lời mời kết bạn
   */
  async rejectRequest(requestId: string, userId: string): Promise<Friendship> {
    this.logger.log(`User ${userId} rejecting request ${requestId}`);

    const request = await this.friendshipRepo.findOne({
      where: { id: requestId },
      relations: ['requester', 'recipient'],
    });
    if (!request) {
      throw new Error('Không tìm thấy lời mời');
    }
    
    if (request.status !== FriendshipStatus.PENDING) {
      throw new Error('Lời mời đã được xử lý');
    }
    
    if (request.recipient.id !== userId) {
      throw new Error('Bạn không có quyền từ chối lời mời này');
    }
    
    request.status = FriendshipStatus.REJECTED;
    return this.friendshipRepo.save(request);
  }

  /**
   * Hủy kết bạn
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
      throw new Error('Không phải bạn bè');
    }
    
    await this.friendshipRepo.remove(relation);
    this.logger.log(`Friendship between ${userId} and ${friendId} removed`);
    
    return relation;
  }

  /**
   * Lấy danh sách bạn bè
   */
  async getFriends(userId: string): Promise<User[]> {
    this.logger.log(`Fetching friends for user: ${userId}`);

    const accepted = await this.friendshipRepo.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { recipient: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'recipient'],
    });

    const friends = accepted.map(f =>
      f.requester.id === userId ? f.recipient : f.requester,
    );

    this.logger.log(`Found ${friends.length} friends for user ${userId}`);
    return friends;
  }

  /**
   * Lấy danh sách lời mời kết bạn đã nhận
   */
  async getPendingRequests(userId: string): Promise<Friendship[]> {
    return this.friendshipRepo.find({
      where: { recipient: { id: userId }, status: FriendshipStatus.PENDING },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Kiểm tra trạng thái friendship giữa 2 user
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
