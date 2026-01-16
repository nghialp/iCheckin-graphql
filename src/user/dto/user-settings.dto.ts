import { Field, InputType, ObjectType, ID } from '@nestjs/graphql';

// Basic User Info for responses
@ObjectType()
export class UserBasicInfo {
  @Field(() => ID)
  id?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  dateOfBirth?: string;

  @Field({ nullable: true })
  gender?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  bio?: string;
}

// Notification Settings
@ObjectType()
export class NotificationSettings {
  @Field({ nullable: true })
  pushNotifications?: boolean;

  @Field({ nullable: true })
  emailNotifications?: boolean;

  @Field({ nullable: true })
  smsNotifications?: boolean;

  @Field({ nullable: true })
  promotions?: boolean;

  @Field({ nullable: true })
  updates?: boolean;

  @Field({ nullable: true })
  reminders?: boolean;
}

@InputType()
export class NotificationSettingsInput {
  @Field({ nullable: true })
  pushNotifications?: boolean;

  @Field({ nullable: true })
  emailNotifications?: boolean;

  @Field({ nullable: true })
  smsNotifications?: boolean;

  @Field({ nullable: true })
  promotions?: boolean;

  @Field({ nullable: true })
  updates?: boolean;

  @Field({ nullable: true })
  reminders?: boolean;
}

// Privacy Settings
@ObjectType()
export class PrivacySettings {
  @Field({ nullable: true })
  locationAccess?: boolean;

  @Field({ nullable: true })
  contactsAccess?: boolean;

  @Field({ nullable: true })
  cameraAccess?: boolean;

  @Field({ nullable: true })
  microphoneAccess?: boolean;

  @Field({ nullable: true })
  profileVisibility?: 'public' | 'friends' | 'private';

  @Field({ nullable: true })
  activityStatus?: boolean;
}

@InputType()
export class PrivacySettingsInput {
  @Field({ nullable: true })
  locationAccess?: boolean;

  @Field({ nullable: true })
  contactsAccess?: boolean;

  @Field({ nullable: true })
  cameraAccess?: boolean;

  @Field({ nullable: true })
  microphoneAccess?: boolean;

  @Field({ nullable: true })
  profileVisibility?: 'public' | 'friends' | 'private';

  @Field({ nullable: true })
  activityStatus?: boolean;
}

// Security Settings
@ObjectType()
export class LoginHistoryItem {
  @Field({ nullable: true })
  timestamp?: string;

  @Field({ nullable: true })
  device?: string;

  @Field({ nullable: true })
  ip?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  status?: string;
}

@ObjectType()
export class ConnectedDeviceItem {
  @Field({ nullable: true })
  id?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  lastActive?: string;
}

@ObjectType()
export class SecuritySettings {
  @Field({ nullable: true })
  twoFactorEnabled?: boolean;

  @Field(() => [LoginHistoryItem], { nullable: true })
  loginHistory?: LoginHistoryItem[];

  @Field(() => [ConnectedDeviceItem], { nullable: true })
  connectedDevices?: ConnectedDeviceItem[];
}

// Update Profile Input
@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  dateOfBirth?: string;

  @Field({ nullable: true })
  gender?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => [String], { nullable: true })
  interests?: string[];

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  hobby?: string;
}

// Update Profile Response
@ObjectType()
export class UpdateProfileResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => UserBasicInfo, { nullable: true })
  user?: UserBasicInfo;
}

// Settings Update Response
@ObjectType()
export class SettingsUpdateResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => NotificationSettings, { nullable: true })
  notificationSettings?: NotificationSettings;

  @Field(() => PrivacySettings, { nullable: true })
  privacySettings?: PrivacySettings;

  @Field(() => SecuritySettings, { nullable: true })
  securitySettings?: SecuritySettings;
}

// Avatar Update Response
@ObjectType()
export class AvatarUpdateResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => UserBasicInfo, { nullable: true })
  user?: UserBasicInfo;
}

