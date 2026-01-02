import { Injectable, Logger } from "@nestjs/common";
import { AuthResponse } from "./dto/auth.response";
import { SignupInput } from "./dto/signup.input";
import { LoginInput } from "./dto/login.input";
import { UserService } from "src/user/user.service";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { OAuthInput } from "./dto/oauth.input";
import { MailService } from "src/mail/mail.service";

// Constants for JWT expiration times
const JWT_EXPIRATION = {
  ACCESS_TOKEN: '1h',
  REFRESH_TOKEN: '7d',
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
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userService.update(userId, { refreshToken: hashedRefresh });
  }

  async signup(input: SignupInput): Promise<AuthResponse> {
    this.logger.log(`Signup attempt for email: ${input.email}`);
    
    const existing = await this.userService.findByEmail(input.email);
    if (existing) {
      this.logger.warn(`Signup failed - email already exists: ${input.email}`);
      throw new Error('Email đã tồn tại');
    }

    const hashed = await bcrypt.hash(input.password, 10);
    const user = await this.userService.create({ ...input, password: hashed });
    
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);
    
    this.logger.log(`User registered successfully: ${user.id}`);
    return { accessToken, refreshToken, user };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    this.logger.log(`Login attempt for email: ${input.email}`);
    
    const user = await this.userService.findByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      this.logger.warn(`Login failed - invalid credentials for: ${input.email}`);
      throw new Error('Email hoặc mật khẩu không đúng');
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
    this.logger.log(`OAuth login attempt for email: ${input.email}`);
    
    let user = await this.userService.findByEmail(input.email);
    if (!user) {
      user = await this.userService.create({
        name: input.name,
        email: input.email,
        avatar: input.avatar,
        password: undefined, // OAuth users don't have password
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
      throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.userService.findById(payload.sub);
    if (!user || !user.refreshToken) {
      this.logger.warn('Refresh token user not found');
      throw new Error('Không tìm thấy người dùng');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      this.logger.warn('Refresh token mismatch');
      throw new Error('Refresh token không khớp');
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
    if (!user) throw new Error('Không tìm thấy người dùng với email này');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userService.update(user.id, { password: hashed });
    
    this.logger.log(`Password reset for user: ${user.id}`);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) throw new Error('Người dùng không tồn tại');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userService.update(user.id, { password: hashed });
    
    this.logger.log(`Password changed for user: ${user.id}`);
  }

  async forgetPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new Error('Không tìm thấy người dùng với email này');
    
    try {
      await this.sendResetPasswordEmail(user);
    } catch (error) {
      this.logger.error(`Failed to send reset password email to: ${email}`, error);
      throw new Error('Gửi email đặt lại mật khẩu thất bại');
    }
  }

  private async sendResetPasswordEmail(user: any): Promise<void> {
    // Tạo mật khẩu tạm thời
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(tempPassword, 10);
    await this.userService.update(user.id, { password: hashed });

    // Gửi email với mật khẩu tạm thời
    await this.mailService.sendResetPasswordEmail(user.email, user.name, tempPassword);
    this.logger.log(`Reset password email sent to: ${user.email}`);
  }
}
