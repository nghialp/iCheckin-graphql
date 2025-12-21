import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Friendship } from "./friendship.entity";
import { Repository } from "typeorm";
import { FriendshipStatus } from "./friendship-status.enum";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class FriendshipService {
    constructor(
        @InjectRepository(Friendship)
        private friendshipRepo: Repository<Friendship>,
    ) {}
    // Gửi lời mời
    async sendRequest(fromId: string, toId: string): Promise<Friendship> {
        const existing = await this.friendshipRepo.findOne({ where: { requester: { id: fromId }, recipient: { id: toId } } });
        if (existing) throw new Error('Đã gửi lời mời');

        const request = this.friendshipRepo.create({
            requester: { id: fromId },
            recipient: { id: toId },
        });
        return this.friendshipRepo.save(request);
    }

    // Chấp nhận lời mời
    async acceptRequest(requestId: string): Promise<Friendship> {
        const request = await this.friendshipRepo.findOne({ where: { id: requestId }, relations: ['requester', 'recipient'] });
        if (!request || request.status !== 'pending') throw new Error('Không tìm thấy lời mời');
        request.status = FriendshipStatus.ACCEPTED;
        return this.friendshipRepo.save(request);
    }

    // Hủy kết bạn
    async unfriend(userId: string, friendId: string): Promise<Friendship> {
        const relation = await this.friendshipRepo.findOne({
            where: [
            { requester: { id: userId }, recipient: { id: friendId }, status: FriendshipStatus.ACCEPTED },
            { requester: { id: friendId }, recipient: { id: userId }, status: FriendshipStatus.ACCEPTED },
            ],
        });
        if (!relation) throw new Error('Không phải bạn bè');
        return this.friendshipRepo.remove(relation);
    }

    // Lấy danh sách bạn
    async getFriends(userId: string): Promise<User[]> {
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

        return friends;
    }
}