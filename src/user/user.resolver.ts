import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import {
  NotificationSettings,
  NotificationSettingsInput,
  PrivacySettings,
  PrivacySettingsInput,
  UpdateProfileInput,
  UpdateProfileResponse,
  SettingsUpdateResponse,
  AvatarUpdateResponse,
} from './dto/user-settings.dto';

@Resolver(() => User)
export class UserResolver {
  private readonly logger = new Logger(UserResolver.name);

  constructor(private usersService: UserService) {}

  @Query(() => [User])
  @UseGuards(GqlAuthGuard)
  getUsers() {
    return this.usersService.getAll();
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  getUser(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Get current user profile
   */
  @Query(() => User, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: User): Promise<User | null> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.usersService.findById(user.id);
  }

  /**
   * Update user profile
   */
  @Mutation(() => UpdateProfileResponse)
  @UseGuards(GqlAuthGuard)
  async updateProfile(
    @Args('input') input: UpdateProfileInput,
    @CurrentUser() user: User,
  ): Promise<UpdateProfileResponse> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    this.logger.log(`Updating profile for user ${user.id}`);
    const updatedUser = await this.usersService.updateProfile(user.id, input);

    return {
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        location: updatedUser.location,
        bio: updatedUser.bio,
      },
    };
  }

  /**
   * Update user avatar
   */
  @Mutation(() => AvatarUpdateResponse)
  @UseGuards(GqlAuthGuard)
  async updateUserAvatar(
    @Args('avatarUrl') avatarUrl: string,
    @CurrentUser() user: User,
  ): Promise<AvatarUpdateResponse> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    this.logger.log(`Updating avatar for user ${user.id}`);
    const updatedUser = await this.usersService.updateUserAvatar(user.id, avatarUrl);

    return {
      success: true,
      message: 'Avatar updated successfully',
      user: {
        id: updatedUser.id,
        avatar: updatedUser.avatar,
      },
    };
  }

  /**
   * Update notification settings
   */
  @Mutation(() => SettingsUpdateResponse)
  @UseGuards(GqlAuthGuard)
  async updateNotificationSettings(
    @Args('input') input: NotificationSettingsInput,
    @CurrentUser() user: User,
  ): Promise<SettingsUpdateResponse> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    this.logger.log(`Updating notification settings for user ${user.id}`);
    const updatedUser = await this.usersService.updateNotificationSettings(user.id, input);

    return {
      success: true,
      message: 'Notification settings updated successfully',
      notificationSettings: updatedUser.notificationSettings,
    };
  }

  /**
   * Update privacy settings
   */
  @Mutation(() => SettingsUpdateResponse)
  @UseGuards(GqlAuthGuard)
  async updatePrivacySettings(
    @Args('input') input: PrivacySettingsInput,
    @CurrentUser() user: User,
  ): Promise<SettingsUpdateResponse> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    this.logger.log(`Updating privacy settings for user ${user.id}`);
    const updatedUser = await this.usersService.updatePrivacySettings(user.id, input);

    return {
      success: true,
      message: 'Privacy settings updated successfully',
      privacySettings: updatedUser.privacySettings,
    };
  }

  /**
   * Get notification settings
   */
  @Query(() => NotificationSettings, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async getNotificationSettings(@CurrentUser() user: User): Promise<NotificationSettings | null> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.usersService.getNotificationSettings(user.id);
  }

  /**
   * Get privacy settings
   */
  @Query(() => PrivacySettings, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async getPrivacySettings(@CurrentUser() user: User): Promise<PrivacySettings | null> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.usersService.getPrivacySettings(user.id);
  }
}
