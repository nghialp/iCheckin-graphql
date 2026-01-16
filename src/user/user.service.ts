import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileInput, NotificationSettings, PrivacySettings, SecuritySettings } from './dto/user-settings.dto';

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

  async getAll(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number; page: number; lastPage: number }> {
    this.logger.log(`Fetching users - page: ${page}, limit: ${limit}`);
    
    const validLimit = Math.min(Math.max(1, limit), 100);
    const validPage = Math.max(1, page);
    const skip = (validPage - 1) * validLimit;
    
    const [users, total] = await this.userRepo.findAndCount({
      order: { createdAt: 'DESC' },
      take: validLimit,
      skip,
    });

    return {
      users,
      total,
      page: validPage,
      lastPage: Math.ceil(total / validLimit),
    };
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

  async updateProfile(id: string, input: UpdateProfileInput): Promise<User> {
    this.logger.log(`Updating profile for user: ${id}`);
    const user = await this.findById(id);
    if (!user) throw new BadRequestException('User not found');

    // Update allowed fields
    if (input.name) user.name = input.name;
    if (input.phone) user.phone = input.phone;
    if (input.avatar) user.avatar = input.avatar;
    if (input.dateOfBirth) user.dateOfBirth = input.dateOfBirth;
    if (input.gender) user.gender = input.gender;
    if (input.location) user.location = input.location;
    if (input.bio) user.bio = input.bio;
    if (input.interests) user.interests = input.interests;
    if (input.country) user.country = input.country;
    if (input.hobby) user.hobby = input.hobby;

    return this.userRepo.save(user);
  }

  async updateUserAvatar(id: string, avatarUrl: string): Promise<User> {
    this.logger.log(`Updating avatar for user: ${id}`);
    const user = await this.findById(id);
    if (!user) throw new BadRequestException('User not found');

    user.avatar = avatarUrl;
    return this.userRepo.save(user);
  }

  async updateNotificationSettings(id: string, settings: NotificationSettings): Promise<User> {
    this.logger.log(`Updating notification settings for user: ${id}`);
    const user = await this.findById(id);
    if (!user) throw new BadRequestException('User not found');

    user.notificationSettings = {
      ...user.notificationSettings,
      ...settings,
    };
    return this.userRepo.save(user);
  }

  async updatePrivacySettings(id: string, settings: PrivacySettings): Promise<User> {
    this.logger.log(`Updating privacy settings for user: ${id}`);
    const user = await this.findById(id);
    if (!user) throw new BadRequestException('User not found');

    user.privacySettings = {
      ...user.privacySettings,
      ...settings,
    };
    return this.userRepo.save(user);
  }

  async updateSecuritySettings(id: string, settings: SecuritySettings): Promise<User> {
    this.logger.log(`Updating security settings for user: ${id}`);
    const user = await this.findById(id);
    if (!user) throw new BadRequestException('User not found');

    user.securitySettings = {
      ...user.securitySettings,
      ...settings,
    };
    return this.userRepo.save(user);
  }

  async getNotificationSettings(id: string): Promise<NotificationSettings | null> {
    this.logger.debug(`Fetching notification settings for user: ${id}`);
    const user = await this.findById(id);
    return user?.notificationSettings || null;
  }

  async getPrivacySettings(id: string): Promise<PrivacySettings | null> {
    this.logger.debug(`Fetching privacy settings for user: ${id}`);
    const user = await this.findById(id);
    return user?.privacySettings || null;
  }

  async getSecuritySettings(id: string): Promise<SecuritySettings | null> {
    this.logger.debug(`Fetching security settings for user: ${id}`);
    const user = await this.findById(id);
    return user?.securitySettings || null;
  }
}
