import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { PubSub } from "graphql-subscriptions";
import { Friendship } from "./friendship.entity";
import { FriendshipStatus } from "./friendship-status.enum";
import { User } from "src/user/entities/user.entity";
import { Like } from "./like.entity";
import { CheckinFavorite } from "./checkin-favorite.entity";
import { PlaceFavorite } from "./place-favorite.entity";
import { Post } from "src/post/post.entity";
import { Checkin } from "src/checkin/checkin.entity";
import { Place } from "src/place/place.entity";
import { CheckinLike } from "src/checkin/checkin-like.entity";
import { CheckinComment } from "src/checkin/checkin-comment.entity";
import { TripLike } from "src/trip/trip-like.entity";
import { TripComment } from "src/trip/trip-comment.entity";
import { Trip } from "src/trip/trip.entity";
import { PUB_SUB } from "src/common/services/pub-sub.service";

// Event names for subscriptions
export const CHECKIN_LIKED_EVENT = 'checkinLiked';
export const CHECKIN_COMMENTED_EVENT = 'checkinCommented';
export const TRIP_LIKED_EVENT = 'tripLiked';
export const TRIP_COMMENTED_EVENT = 'tripCommented';
export const POST_LIKED_EVENT = 'postLiked';

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
    @InjectRepository(Like)
    private likeRepo: Repository<Like>,
    @InjectRepository(CheckinFavorite)
    private checkinFavoriteRepo: Repository<CheckinFavorite>,
    @InjectRepository(PlaceFavorite)
    private placeFavoriteRepo: Repository<PlaceFavorite>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    @InjectRepository(Checkin)
    private checkinRepo: Repository<Checkin>,
    @InjectRepository(Place)
    private placeRepo: Repository<Place>,
    @InjectRepository(CheckinLike)
    private checkinLikeRepo: Repository<CheckinLike>,
    @InjectRepository(CheckinComment)
    private checkinCommentRepo: Repository<CheckinComment>,
    @InjectRepository(TripLike)
    private tripLikeRepo: Repository<TripLike>,
    @InjectRepository(TripComment)
    private tripCommentRepo: Repository<TripComment>,
    @InjectRepository(Trip)
    private tripRepo: Repository<Trip>,
    @Inject(PUB_SUB) private pubSub: PubSub,
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

  // ==================== Follow System ====================

  async followUser(followerId: string, followingId: string): Promise<User> {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const follower = await this.userRepo.findOne({ where: { id: followerId }, relations: ['followings'] });
    const following = await this.userRepo.findOne({ where: { id: followingId } });

    if (!follower || !following) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const isFollowing = follower.followings?.some(u => u.id === followingId);
    if (isFollowing) {
      throw new BadRequestException('Already following this user');
    }

    if (!follower.followings) {
      follower.followings = [];
    }
    follower.followings.push(following);

    await this.userRepo.save(follower);
    this.logger.log(`User ${followerId} followed ${followingId}`);
    return following;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const follower = await this.userRepo.findOne({ where: { id: followerId }, relations: ['followings'] });

    if (!follower) {
      throw new NotFoundException('User not found');
    }

    if (!follower.followings?.some(u => u.id === followingId)) {
      throw new BadRequestException('Not following this user');
    }

    follower.followings = follower.followings.filter(u => u.id !== followingId);
    await this.userRepo.save(follower);

    this.logger.log(`User ${followerId} unfollowed ${followingId}`);
    return true;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['followers'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.followers || [];
  }

  async getFollowings(userId: string): Promise<User[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['followings'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.followings || [];
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follower = await this.userRepo.findOne({
      where: { id: followerId },
      relations: ['followings'],
    });

    return follower?.followings?.some(u => u.id === followingId) ?? false;
  }

  // ==================== Like Post System ====================

  async likePost(userId: string, postId: string): Promise<Like> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const post = await this.postRepo.findOne({ where: { id: postId } });

    if (!user || !post) {
      throw new NotFoundException('User or Post not found');
    }

    // Check if already liked
    const existing = await this.likeRepo.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existing) {
      throw new BadRequestException('Already liked this post');
    }

    const like = this.likeRepo.create({
      user,
      post,
    });

    await this.likeRepo.save(like);
    this.logger.log(`User ${userId} liked post ${postId}`);

    // Publish like event for subscriptions
    const likeCount = await this.likeRepo.count({ where: { post: { id: postId } } });
    await this.pubSub.publish(POST_LIKED_EVENT, {
      postLiked: { postId, like, likeCount },
    });

    return like;
  }

  async unlikePost(userId: string, postId: string): Promise<boolean> {
    const like = await this.likeRepo.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.likeRepo.remove(like);
    this.logger.log(`User ${userId} unliked post ${postId}`);
    return true;
  }

  async getPostLikes(postId: string): Promise<Like[]> {
    return this.likeRepo.find({
      where: { post: { id: postId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async hasUserLikedPost(userId: string, postId: string): Promise<boolean> {
    const like = await this.likeRepo.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    return !!like;
  }

  async getPostLikeCount(postId: string): Promise<number> {
    return this.likeRepo.count({
      where: { post: { id: postId } },
    });
  }

  async getUserLikedPosts(userId: string): Promise<Post[]> {
    const likes = await this.likeRepo.find({
      where: { user: { id: userId } },
      relations: ['post'],
      order: { createdAt: 'DESC' },
    });

    return likes.map(like => like.post);
  }

  // ==================== Checkin Favorites ====================

  async addCheckinFavorite(userId: string, checkinId: string): Promise<CheckinFavorite> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const checkin = await this.checkinRepo.findOne({ where: { id: checkinId } });

    if (!user || !checkin) {
      throw new NotFoundException('User or Checkin not found');
    }

    // Check if already favorited
    const existing = await this.checkinFavoriteRepo.findOne({
      where: { user: { id: userId }, checkin: { id: checkinId } },
    });

    if (existing) {
      throw new BadRequestException('Already favorited this checkin');
    }

    const favorite = this.checkinFavoriteRepo.create({
      user,
      checkin,
    });

    await this.checkinFavoriteRepo.save(favorite);
    this.logger.log(`User ${userId} favorited checkin ${checkinId}`);
    return favorite;
  }

  async removeCheckinFavorite(userId: string, checkinId: string): Promise<boolean> {
    const favorite = await this.checkinFavoriteRepo.findOne({
      where: { user: { id: userId }, checkin: { id: checkinId } },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.checkinFavoriteRepo.remove(favorite);
    this.logger.log(`User ${userId} removed checkin favorite ${checkinId}`);
    return true;
  }

  async getUserFavoriteCheckins(userId: string): Promise<Checkin[]> {
    const favorites = await this.checkinFavoriteRepo.find({
      where: { user: { id: userId } },
      relations: ['checkin'],
      order: { createdAt: 'DESC' },
    });

    return favorites.map(fav => fav.checkin);
  }

  async isCheckinFavorited(userId: string, checkinId: string): Promise<boolean> {
    const favorite = await this.checkinFavoriteRepo.findOne({
      where: { user: { id: userId }, checkin: { id: checkinId } },
    });

    return !!favorite;
  }

  // ==================== Place Favorites ====================

  async addPlaceFavorite(userId: string, placeId: string): Promise<PlaceFavorite> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const place = await this.placeRepo.findOne({ where: { id: placeId } });

    if (!user || !place) {
      throw new NotFoundException('User or Place not found');
    }

    // Check if already favorited
    const existing = await this.placeFavoriteRepo.findOne({
      where: { user: { id: userId }, place: { id: placeId } },
    });

    if (existing) {
      throw new BadRequestException('Already favorited this place');
    }

    const favorite = this.placeFavoriteRepo.create({
      user,
      place,
    });

    await this.placeFavoriteRepo.save(favorite);
    this.logger.log(`User ${userId} favorited place ${placeId}`);
    return favorite;
  }

  async removePlaceFavorite(userId: string, placeId: string): Promise<boolean> {
    const favorite = await this.placeFavoriteRepo.findOne({
      where: { user: { id: userId }, place: { id: placeId } },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.placeFavoriteRepo.remove(favorite);
    this.logger.log(`User ${userId} removed place favorite ${placeId}`);
    return true;
  }

  async getUserFavoritePlaces(userId: string): Promise<Place[]> {
    const favorites = await this.placeFavoriteRepo.find({
      where: { user: { id: userId } },
      relations: ['place'],
      order: { createdAt: 'DESC' },
    });

    return favorites.map(fav => fav.place);
  }

  async isPlaceFavorited(userId: string, placeId: string): Promise<boolean> {
    const favorite = await this.placeFavoriteRepo.findOne({
      where: { user: { id: userId }, place: { id: placeId } },
    });

    return !!favorite;
  }

  async getPlaceFavoriteCount(placeId: string): Promise<number> {
    return this.placeFavoriteRepo.count({
      where: { place: { id: placeId } },
    });
  }

  // ==================== Checkin Like System ====================

  async toggleLikeCheckin(userId: string, checkinId: string): Promise<{ liked: boolean; likeCount: number }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const checkin = await this.checkinRepo.findOne({ where: { id: checkinId } });

    if (!user || !checkin) {
      throw new NotFoundException('User or Checkin not found');
    }

    const existing = await this.checkinLikeRepo.findOne({
      where: { user: { id: userId }, checkin: { id: checkinId } },
    });

    if (existing) {
      // Already liked - remove the like
      await this.checkinLikeRepo.remove(existing);
      this.logger.log(`User ${userId} unliked checkin ${checkinId}`);
      const likeCount = await this.checkinLikeRepo.count({ where: { checkin: { id: checkinId } } });
      
      // Publish event
      await this.pubSub.publish(CHECKIN_LIKED_EVENT, {
        checkinLiked: { checkinId, like: existing, likeCount },
      });
      
      return { liked: false, likeCount };
    } else {

      // Not liked yet - add the like
      const like = this.checkinLikeRepo.create({ user, checkin });
      await this.checkinLikeRepo.save(like);
      this.logger.log(`User ${userId} liked checkin ${checkinId}`);
      const likeCount = await this.checkinLikeRepo.count({ where: { checkin: { id: checkinId } } });
      
      // Publish event
      await this.pubSub.publish(CHECKIN_LIKED_EVENT, {
        checkinLiked: { checkinId, like, likeCount },
      });
      
      return { liked: true, likeCount };
    }
  }

  async getCheckinLikes(checkinId: string): Promise<CheckinLike[]> {
    return this.checkinLikeRepo.find({
      where: { checkin: { id: checkinId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async hasUserLikedCheckin(userId: string, checkinId: string): Promise<boolean> {
    const like = await this.checkinLikeRepo.findOne({
      where: { user: { id: userId }, checkin: { id: checkinId } },
    });
    return !!like;
  }

  async getCheckinLikeCount(checkinId: string): Promise<number> {
    return this.checkinLikeRepo.count({
      where: { checkin: { id: checkinId } },
    });
  }

  // ==================== Checkin Comment System ====================

  async createCheckinComment(userId: string, checkinId: string, content: string, parentId?: string): Promise<CheckinComment> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const checkin = await this.checkinRepo.findOne({ where: { id: checkinId } });

    if (!user || !checkin) {
      throw new NotFoundException('User or Checkin not found');
    }

    const comment = this.checkinCommentRepo.create({
      user,
      checkin,
      content,
      parent_id: parentId,
    });

    await this.checkinCommentRepo.save(comment);
    this.logger.log(`User ${userId} commented on checkin ${checkinId}`);

    // Publish comment event for subscriptions
    await this.pubSub.publish(CHECKIN_COMMENTED_EVENT, {
      checkinCommented: { checkinId, comment },
    });

    return comment;
  }

  async getCheckinComments(checkinId: string): Promise<CheckinComment[]> {
    return this.checkinCommentRepo.find({
      where: { checkin: { id: checkinId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async deleteCheckinComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.checkinCommentRepo.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new BadRequestException('You can only delete your own comments');
    }

    await this.checkinCommentRepo.remove(comment);
    this.logger.log(`User ${userId} deleted checkin comment ${commentId}`);
    return true;
  }

  // ==================== Trip Like System ====================

  async toggleLikeTrip(userId: string, tripId: string): Promise<{ liked: boolean; likeCount: number }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });

    if (!user || !trip) {
      throw new NotFoundException('User or Trip not found');
    }

    const existing = await this.tripLikeRepo.findOne({
      where: { user: { id: userId }, trip: { id: tripId } },
    });

    if (existing) {
      // Already liked - remove the like
      await this.tripLikeRepo.remove(existing);
      this.logger.log(`User ${userId} unliked trip ${tripId}`);
      const likeCount = await this.tripLikeRepo.count({ where: { trip: { id: tripId } } });

      // Publish event for subscriptions
      await this.pubSub.publish(TRIP_LIKED_EVENT, {
        tripLiked: { tripId, like: existing, likeCount },
      });

      return { liked: false, likeCount };
    } else {
      // Not liked yet - add the like
      const like = this.tripLikeRepo.create({ user, trip });
      await this.tripLikeRepo.save(like);
      this.logger.log(`User ${userId} liked trip ${tripId}`);
      const likeCount = await this.tripLikeRepo.count({ where: { trip: { id: tripId } } });

      // Publish event for subscriptions
      await this.pubSub.publish(TRIP_LIKED_EVENT, {
        tripLiked: { tripId, like, likeCount },
      });

      return { liked: true, likeCount };
    }
  }

  async getTripLikes(tripId: string): Promise<TripLike[]> {
    return this.tripLikeRepo.find({
      where: { trip: { id: tripId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async hasUserLikedTrip(userId: string, tripId: string): Promise<boolean> {
    const like = await this.tripLikeRepo.findOne({
      where: { user: { id: userId }, trip: { id: tripId } },
    });
    return !!like;
  }

  async getTripLikeCount(tripId: string): Promise<number> {
    return this.tripLikeRepo.count({
      where: { trip: { id: tripId } },
    });
  }

  // ==================== Trip Comment System ====================

  async createTripComment(userId: string, tripId: string, content: string, parentId?: string): Promise<TripComment> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });

    if (!user || !trip) {
      throw new NotFoundException('User or Trip not found');
    }

    const comment = this.tripCommentRepo.create({
      user,
      trip,
      content,
      parent_id: parentId,
    });

    await this.tripCommentRepo.save(comment);
    this.logger.log(`User ${userId} commented on trip ${tripId}`);

    // Publish comment event for subscriptions
    await this.pubSub.publish(TRIP_COMMENTED_EVENT, {
      tripCommented: { tripId, comment },
    });

    return comment;
  }

  async getTripComments(tripId: string): Promise<TripComment[]> {
    return this.tripCommentRepo.find({
      where: { trip: { id: tripId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async deleteTripComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.tripCommentRepo.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new BadRequestException('You can only delete your own comments');
    }

    await this.tripCommentRepo.remove(comment);
    this.logger.log(`User ${userId} deleted trip comment ${commentId}`);
    return true;
  }
}
