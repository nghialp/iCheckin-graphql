import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Checkin } from "./checin.entity";
import { User } from "src/user/entities/user.entity";
import { Place } from "src/place/place.entity";

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
      status: status || 'checked_in',
      mood,
      checkedAt: new Date(),
    });
    
    const saved = await this.checkinRepo.save(checkin);
    this.logger.log(`Checkin created successfully: ${saved.id}`);
    
    return saved;
  }

  async getUserCheckins(userId: string): Promise<Checkin[]> {
    this.logger.log(`Fetching checkins for user: ${userId}`);
    
    return this.checkinRepo.find({
      where: { user: { id: userId } },
      relations: ['place', 'user'],
      order: { checkedAt: 'DESC' },
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
      return false;
    }

    if (checkin.user.id !== userId) {
      this.logger.warn(`User ${userId} attempted to delete checkin ${id} owned by ${checkin.user.id}`);
      throw new Error('Bạn không có quyền xóa checkin này');
    }

    await this.checkinRepo.remove(checkin);
    this.logger.log(`Checkin ${id} deleted successfully`);
    
    return true;
  }
}
