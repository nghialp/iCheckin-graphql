import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('FACEBOOK_APP_ID') || '',
      clientSecret: config.get('FACEBOOK_APP_SECRET') || '',
      callbackURL: config.get('FACEBOOK_CALLBACK_URL') || '',
      profileFields: ['id', 'displayName', 'emails', 'photos'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { id, displayName, emails, photos } = profile;
    return {
      provider: 'facebook',
      providerId: id,
      name: displayName,
      email: emails?.[0]?.value,
      avatar: photos?.[0]?.value,
    };
  }
}