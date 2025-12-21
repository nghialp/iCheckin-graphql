import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Checkin } from "./checin.entity";

@Injectable()
export class CheckinService {
    constructor(
        @InjectRepository(Checkin)
        private checkinRepo: Repository<Checkin>,
    ) {}
    async createCheckin(userId: string, location: string, note?: string) {
  const checkin = this.checkinRepo.create({
    user: { id: userId },
    location,
    note,
  });
  return this.checkinRepo.save(checkin);
}

async getUserCheckins(userId: string) {
  return this.checkinRepo.find({
    where: { user: { id: userId } },
    order: { checkedAt: 'DESC' },
  });
}

async getCheckinsByLocation(location: string) {
  return this.checkinRepo.find({
    where: { location },
    relations: ['user'],
    order: { checkedAt: 'DESC' },
  });
}
}