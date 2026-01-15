import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserService } from "src/user/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private config: ConfigService,
    private userService: UserService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    this.logger.debug(`JWT payload validated: sub=${payload.sub}, email=${payload.email}`);

    try {
      // Fetch the full user object from database
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        this.logger.warn(`User not found for JWT sub: ${payload.sub}`);
        return null;
      }

      this.logger.debug(`User loaded from JWT: ${user.id}`);
      return user; // Return full user object
    } catch (error) {
      this.logger.error(`Error validating JWT: ${(error as Error).message}`);
      return null;
    }
  }
}
