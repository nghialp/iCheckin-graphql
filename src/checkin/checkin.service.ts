import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Checkin } from "./checkin.entity";
import { User } from "src/user/entities/user.entity";
import { Place } from "src/place/place.entity";
import { CONSTANTS } from "src/common/constants";

// Error messages
const ERROR_MESSAGES = {
  CHECKIN_NOT_FOUND: 'Checkin not found',
  UNAUTHORIZED_DELETE: 'You do not have permission to delete this checkin',
} as const;

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(
    @InjectRepository(Checkin)
    private checkinRepo: Repository<Checkin>,
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
      throw new Error(ERROR_MESSAGES.CHECKIN_NOT_FOUND);
    }

    if (checkin.user.id !== userId) {
      this.logger.warn(`User ${userId} attempted to delete checkin ${id} owned by ${checkin.user.id}`);
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED_DELETE);
    }

    await this.checkinRepo.remove(checkin);
    this.logger.log(`Checkin ${id} deleted successfully`);
    
    return true;
  }
}
