import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    const clientID = config.get('FACEBOOK_APP_ID');
    const clientSecret = config.get('FACEBOOK_APP_SECRET');
    const callbackURL = config.get('FACEBOOK_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Facebook OAuth configuration is missing. Please set FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and FACEBOOK_CALLBACK_URL');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
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
