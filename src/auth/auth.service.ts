import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { AuthResponse } from "./dto/auth.response";
import { SignupInput } from "./dto/signup.input";
import { LoginInput } from "./dto/login.input";
import { UserService } from "src/user/user.service";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { OAuthInput } from "./dto/oauth.input";
import { MailService } from "src/mail/mail.service";
import { CONSTANTS } from "src/common/constants";

// Constants for JWT expiration times - use shared constants
const JWT_EXPIRATION = CONSTANTS.JWT.EXPIRATION;
const SALT_ROUNDS = CONSTANTS.PASSWORD.SALT_ROUNDS;

// Custom error messages (English only)
const ERROR_MESSAGES = {
  EMAIL_EXISTS: 'Email already exists',
  INCORRECT_PASSWORD: 'Password is incorrect',
  EMAIL_NOT_REGISTER: 'Email is not registered',
  USER_NOT_FOUND: 'User not found',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_MISMATCH: 'Token mismatch',
  PASSWORD_RESET_FAILED: 'Failed to send reset password email',
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private mailService: MailService,
  ) {}

  /**
   * Generate access and refresh tokens for a user
   */
  private async generateTokens(user: { id: string; email: string }): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: JWT_EXPIRATION.ACCESS_TOKEN }
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: JWT_EXPIRATION.REFRESH_TOKEN }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Save hashed refresh token to user record
   */
  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefresh = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.userService.update(userId, { refreshToken: hashedRefresh });
  }

  /**
   * Generate a secure random password for OAuth users
   */
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = 24;
    let password = '';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      password += chars[randomValues[i] % chars.length];
    }
    return password;
  }

  async signup(input: SignupInput): Promise<AuthResponse> {
    // Mask email in logs for privacy
    const maskedEmail = input.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    this.logger.log(`Signup attempt for user: ${maskedEmail}`);
    
    const existing = await this.userService.findByEmail(input.email);
    if (existing) {
      this.logger.warn(`Signup failed - email already exists: ${maskedEmail}`);
      throw new BadRequestException([{
        field: 'email',
        message: ERROR_MESSAGES.EMAIL_EXISTS
      }]);
    }

    const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.userService.create({ ...input, password: hashed });
    
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);
    
    this.logger.log(`User registered successfully: ${user.id}`);
    return { accessToken, refreshToken, user };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    // Mask email in logs for privacy
    const maskedEmail = input.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    this.logger.log(`Login attempt for user: ${maskedEmail}`);
    
    const user = await this.userService.findByEmail(input.email);
    if (!user) {
      this.logger.warn(`Login failed - email not registered: ${maskedEmail}`);
      throw new BadRequestException([{
        field: 'email',
        message: ERROR_MESSAGES.EMAIL_NOT_REGISTER
      }]);
    }
    if (!(await bcrypt.compare(input.password, user.password))) {
      this.logger.warn(`Login failed - invalid credentials for: ${maskedEmail}`);
      throw new BadRequestException([{
        field: 'password',
        message: ERROR_MESSAGES.INCORRECT_PASSWORD
      }]);
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);
    
    this.logger.log(`User logged in successfully: ${user.id}`);
    return { accessToken, refreshToken, user };
  }

  async getUserProfile(id: string) {
    return this.userService.findById(id);
  }

  async handleOAuth(input: OAuthInput): Promise<AuthResponse> {
    // Mask email in logs for privacy
    const maskedEmail = input.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    this.logger.log(`OAuth login attempt for user: ${maskedEmail}`);
    
    let user = await this.userService.findByEmail(input.email);
    if (!user) {
      // Generate a secure random password for OAuth users
      const securePassword = this.generateSecurePassword();
      const hashedPassword = await bcrypt.hash(securePassword, SALT_ROUNDS);
      
      user = await this.userService.create({
        name: input.name,
        email: input.email,
        avatar: input.avatar,
        password: hashedPassword,
      });
      this.logger.log(`New OAuth user created: ${user.id}`);
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);
    
    this.logger.log(`OAuth user authenticated: ${user.id}`);
    return { accessToken, refreshToken, user };
  }

  async refreshTokenFlow(refreshToken: string): Promise<AuthResponse> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch (error) {
      this.logger.warn('Refresh token verification failed');
      throw new BadRequestException([{
        field: 'refreshToken',
        message: ERROR_MESSAGES.INVALID_TOKEN
      }]);
    }

    const user = await this.userService.findById(payload.sub);
    if (!user || !user.refreshToken) {
      this.logger.warn('Refresh token user not found');
      throw new BadRequestException([{
        field: 'refreshToken',
        message: ERROR_MESSAGES.USER_NOT_FOUND
      }]);
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      this.logger.warn('Refresh token mismatch');
      throw new BadRequestException([{
        field: 'refreshToken',
        message: ERROR_MESSAGES.TOKEN_MISMATCH
      }]);
    }
    
    const newAccessToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: JWT_EXPIRATION.ACCESS_TOKEN }
    );
    
    this.logger.log(`Token refreshed for user: ${user.id}`);
    return { accessToken: newAccessToken, refreshToken, user };
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException([{
      field: 'email',
      message: ERROR_MESSAGES.USER_NOT_FOUND
    }]);

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userService.update(user.id, { password: hashed });
    
    this.logger.log(`Password reset for user: ${user.id}`);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) throw new BadRequestException([{
      field: 'user',
      message: ERROR_MESSAGES.USER_NOT_FOUND
    }]);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new BadRequestException([{
      field: 'currentPassword',
      message: 'Current password is incorrect'
    }]);

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userService.update(user.id, { password: hashed });
    
    this.logger.log(`Password changed for user: ${user.id}`);
  }

  async forgetPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException([{
      field: 'email',
      message: ERROR_MESSAGES.USER_NOT_FOUND
    }]);
    
    try {
      await this.sendResetPasswordEmail(user);
    } catch (error) {
      this.logger.error(`Failed to send reset password email to: ${email}`, error);
      throw new BadRequestException([{
        field: 'email',
        message: ERROR_MESSAGES.PASSWORD_RESET_FAILED
      }]);
    }
  }

  private async sendResetPasswordEmail(user: any): Promise<void> {
    // Generate a secure temporary password
    const tempPassword = this.generateSecurePassword();
    const hashed = await bcrypt.hash(tempPassword, SALT_ROUNDS);
    await this.userService.update(user.id, { password: hashed });

    // Send email with temporary password
    await this.mailService.sendResetPasswordEmail(user.email, user.name, tempPassword);
    this.logger.log(`Reset password email sent to user: ${user.id}`);
  }
}
