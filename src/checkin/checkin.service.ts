import { Injectable, Logger, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Checkin } from "./checkin.entity";
import { User } from "src/user/entities/user.entity";
import { Place } from "src/place/place.entity";
import { CONSTANTS } from "src/common/constants";
import { FriendshipService } from "src/friendships/friendship.service";

// Error messages
const ERROR_MESSAGES = {
  CHECKIN_NOT_FOUND: 'Checkin not found',
  UNAUTHORIZED_DELETE: 'You do not have permission to delete this checkin',
} as const;

// Default radius in kilometers
const DEFAULT_RADIUS_KM = 5;

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(
    @InjectRepository(Checkin)
    private checkinRepo: Repository<Checkin>,
    private friendshipService: FriendshipService,
  ) { }

  async createCheckin(user: User, place: Place, status?: string, mood?: string): Promise<Checkin> {
    this.logger.log(`Creating checkin for user ${user.id} at place ${place.id}`);
    
    const checkin = this.checkinRepo.create({
      user,
      place,
      status: status || CONSTANTS.CHECKIN_STATUS.CHECKED_IN,
      mood,
      checkedAt: new Date(),
    });
    
    const saved = await this.checkinRepo.save(checkin);
    this.logger.log(`Checkin created successfully: ${saved.id}`);
    
    return saved;
  }

  async getUserCheckins(userId: string, page: number = CONSTANTS.PAGINATION.DEFAULT_PAGE, limit: number = CONSTANTS.PAGINATION.DEFAULT_LIMIT): Promise<Checkin[]> {
    this.logger.log(`Fetching checkins for user: ${userId}`);
    
    // Ensure limit doesn't exceed max
    const validLimit = Math.min(limit, CONSTANTS.PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * validLimit;
    
    return this.checkinRepo.find({
      where: { user: { id: userId } },
      relations: ['place', 'user'],
      order: { checkedAt: 'DESC' },
      take: validLimit,
      skip,
    });
  }

  async getCheckinById(id: string): Promise<Checkin | null> {
    return this.checkinRepo.findOne({
      where: { id },
      relations: ['place', 'user'],
    });
  }

  async deleteCheckin(id: string, userId: string): Promise<boolean> {
    this.logger.log(`Deleting checkin ${id} for user ${userId}`);
    
    const checkin = await this.checkinRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!checkin) {
      this.logger.warn(`Checkin not found: ${id}`);
      throw new NotFoundException(ERROR_MESSAGES.CHECKIN_NOT_FOUND);
    }

    if (checkin.user.id !== userId) {
      this.logger.warn(`User ${userId} attempted to delete checkin ${id} owned by ${checkin.user.id}`);
      throw new ForbiddenException(ERROR_MESSAGES.UNAUTHORIZED_DELETE);
    }

    await this.checkinRepo.remove(checkin);
    this.logger.log(`Checkin ${id} deleted successfully`);
    
    return true;
  }

  /**
   * Get checkins near a specific location using Haversine formula
   * @param lat Latitude of the center point
   * @param lng Longitude of the center point
   * @param radiusKm Radius in kilometers (default: 5km)
   * @param userId Optional user ID to filter by specific user
   * @param page Pagination page number
   * @param limit Pagination limit
   */
  async getCheckinsByNearByLocation(
    lat: number,
    lng: number,
    radiusKm: number = DEFAULT_RADIUS_KM,
    userId?: string,
    page: number = CONSTANTS.PAGINATION.DEFAULT_PAGE,
    limit: number = CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  ): Promise<Checkin[]> {
    this.logger.log(`Fetching checkins near lat: ${lat}, lng: ${lng}, radius: ${radiusKm}km`);

    const validLimit = Math.min(limit, CONSTANTS.PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * validLimit;

    // Build query using Haversine formula for distance calculation
    // This calculates the distance between two points on Earth
    const checkins = await this.checkinRepo
      .createQueryBuilder('checkin')
      .innerJoinAndSelect('checkin.place', 'place')
      .innerJoinAndSelect('checkin.user', 'user')
      .where(`
        (6371 * acos(
          cos(radians(:lat)) * cos(radians(place.lat)) *
          cos(radians(place.lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(place.lat))
        )) <= :radius
      `, { lat, lng, radius: radiusKm })
      .andWhere(userId ? 'checkin.user_id = :userId' : '1=1', { userId })
      .orderBy('checkin.checkedAt', 'DESC')
      .take(validLimit)
      .skip(skip)
      .getMany();

    this.logger.log(`Found ${checkins.length} checkins near location`);
    return checkins;
  }

  /**
   * Get all checkins from a user's friends
   * @param userId The user ID to get friends' checkins for
   * @param page Pagination page number
   * @param limit Pagination limit
   */
  async getFriendsCheckins(
    userId: string,
    page: number = CONSTANTS.PAGINATION.DEFAULT_PAGE,
    limit: number = CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  ): Promise<Checkin[]> {
    this.logger.log(`Fetching friends' checkins for user: ${userId}`);

    const validLimit = Math.min(limit, CONSTANTS.PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * validLimit;

    // Get user's friends
    const friends = await this.friendshipService.getFriends(userId);
    const friendIds = friends.map(friend => friend.id);

    if (friendIds.length === 0) {
      this.logger.log(`User ${userId} has no friends, returning empty list`);
      return [];
    }

    // Get checkins from friends
    const checkins = await this.checkinRepo
      .createQueryBuilder('checkin')
      .innerJoinAndSelect('checkin.place', 'place')
      .innerJoinAndSelect('checkin.user', 'user')
      .where('checkin.user_id IN (:...friendIds)', { friendIds })
      .orderBy('checkin.checkedAt', 'DESC')
      .take(validLimit)
      .skip(skip)
      .getMany();

    this.logger.log(`Found ${checkins.length} friends' checkins for user ${userId}`);
    return checkins;
  }

  /**
   * Get friends' checkins near a specific location
   * @param userId The user ID to get friends' checkins for
   * @param lat Latitude of the center point
   * @param lng Longitude of the center point
   * @param radiusKm Radius in kilometers (default: 5km)
   * @param page Pagination page number
   * @param limit Pagination limit
   */
  async getFriendsCheckinsByLocation(
    userId: string,
    lat: number,
    lng: number,
    radiusKm: number = DEFAULT_RADIUS_KM,
    page: number = CONSTANTS.PAGINATION.DEFAULT_PAGE,
    limit: number = CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  ): Promise<Checkin[]> {
    this.logger.log(`Fetching friends' checkins near lat: ${lat}, lng: ${lng}, radius: ${radiusKm}km for user: ${userId}`);

    const validLimit = Math.min(limit, CONSTANTS.PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * validLimit;

    // Get user's friends
    const friends = await this.friendshipService.getFriends(userId);
    const friendIds = friends.map(friend => friend.id);

    if (friendIds.length === 0) {
      this.logger.log(`User ${userId} has no friends, returning empty list`);
      return [];
    }

    // Get checkins from friends near the location
    const checkins = await this.checkinRepo
      .createQueryBuilder('checkin')
      .innerJoinAndSelect('checkin.place', 'place')
      .innerJoinAndSelect('checkin.user', 'user')
      .where('checkin.user_id IN (:...friendIds)', { friendIds })
      .andWhere(`
        (6371 * acos(
          cos(radians(:lat)) * cos(radians(place.lat)) *
          cos(radians(place.lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(place.lat))
        )) <= :radius
      `, { lat, lng, radius: radiusKm })
      .orderBy('checkin.checkedAt', 'DESC')
      .take(validLimit)
      .skip(skip)
      .getMany();

    this.logger.log(`Found ${checkins.length} friends' checkins near location for user ${userId}`);
    return checkins;
  }

  /**
   * Get all checkins for a specific place by mapboxId
   * @param mapboxId The Mapbox place ID
   * @param page Pagination page number
   * @param limit Pagination limit
   */
  async getPlaceCheckinsByMapboxId(
    mapboxId: string,
    page: number = CONSTANTS.PAGINATION.DEFAULT_PAGE,
    limit: number = CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  ): Promise<Checkin[]> {
    this.logger.log(`Fetching all checkins for mapboxId: ${mapboxId}`);

    const validLimit = Math.min(limit, CONSTANTS.PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * validLimit;

    const checkins = await this.checkinRepo
      .createQueryBuilder('checkin')
      .innerJoinAndSelect('checkin.place', 'place')
      .innerJoinAndSelect('checkin.user', 'user')
      .where('place.mapboxId = :mapboxId', { mapboxId })
      .orderBy('checkin.checkedAt', 'DESC')
      .take(validLimit)
      .skip(skip)
      .getMany();

    this.logger.log(`Found ${checkins.length} checkins for mapboxId ${mapboxId}`);
    return checkins;
  }

  /**
   * Check if a user has checked in at a place by mapboxId
   * @param userId The user ID
   * @param mapboxId The Mapbox place ID
   */
  async hasUserCheckedInByMapboxId(userId: string, mapboxId: string): Promise<boolean> {
    const checkin = await this.checkinRepo.findOne({
      where: { user: { id: userId }, place: { mapboxId } },
    });
    return !!checkin;
  }

  /**
   * Get user's checkin for a place by mapboxId
   * @param userId The user ID
   * @param mapboxId The Mapbox place ID
   */
  async getUserCheckinByMapboxId(userId: string, mapboxId: string): Promise<Checkin | null> {
    return this.checkinRepo.findOne({
      where: { user: { id: userId }, place: { mapboxId } },
      relations: ['place', 'user'],
    });
  }

  /**
   * Get friends' checkins for a place by mapboxId
   * @param userId The user ID to get friends' checkins for
   * @param mapboxId The Mapbox place ID
   * @param page Pagination page number
   * @param limit Pagination limit
   */
  async getFriendsCheckinsByMapboxId(
    userId: string,
    mapboxId: string,
    page: number = CONSTANTS.PAGINATION.DEFAULT_PAGE,
    limit: number = CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  ): Promise<Checkin[]> {
    this.logger.log(`Fetching friends' checkins for mapboxId: ${mapboxId}, user: ${userId}`);

    const validLimit = Math.min(limit, CONSTANTS.PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * validLimit;

    // Get user's friends
    const friends = await this.friendshipService.getFriends(userId);
    const friendIds = friends.map(friend => friend.id);

    if (friendIds.length === 0) {
      this.logger.log(`User ${userId} has no friends, returning empty list`);
      return [];
    }

    // Get checkins from friends for this place
    const checkins = await this.checkinRepo
      .createQueryBuilder('checkin')
      .innerJoinAndSelect('checkin.place', 'place')
      .innerJoinAndSelect('checkin.user', 'user')
      .where('place.mapboxId = :mapboxId', { mapboxId })
      .andWhere('checkin.user_id IN (:...friendIds)', { friendIds })
      .orderBy('checkin.checkedAt', 'DESC')
      .take(validLimit)
      .skip(skip)
      .getMany();

    this.logger.log(`Found ${checkins.length} friends' checkins for mapboxId ${mapboxId}`);
    return checkins;
  }
}
