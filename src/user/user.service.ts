import { Injectable, Logger } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    this.logger.log(`Creating user with email: ${data.email}`);
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`);
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    this.logger.debug(`Finding user by id: ${id}`);
    return this.userRepo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    this.logger.log(`Updating user: ${id}`);
    await this.userRepo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new Error('User not found');
    return updated;
  }

  async addPoints(id: string, points: number): Promise<User> {
    this.logger.log(`Adding ${points} points to user: ${id}`);
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');
    user.points += points;
    return this.userRepo.save(user);
  }

  async getAll(): Promise<User[]> {
    this.logger.log('Fetching all users');
    return this.userRepo.find();
  }

  async delete(id: string): Promise<boolean> {
    this.logger.log(`Deleting user: ${id}`);
    const result = await this.userRepo.delete(id);
    return (result.affected || 0) > 0;
  }

  async findUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    return this.userRepo.createQueryBuilder('user')
      .whereInIds(ids)
      .getMany();
  }
}
