import { Injectable } from "@nestjs/common";
import { AuthResponse } from "./dto/auth.response";
import { SignupInput } from "./dto/signup.input";
import { LoginInput } from "./dto/login.input";
import { UserService } from "src/user/user.service";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { OAuthInput } from "./dto/oauth.input";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private userService: UserService,
    ) {}

    async signup(input: SignupInput): Promise<AuthResponse> {
        const existing = await this.userService.findByEmail(input.email);
        if (existing) throw new Error('Email đã tồn tại');

        const hashed = await bcrypt.hash(input.password, 10);
        const user = await this.userService.create({ ...input, password: hashed });
        const accessToken = this.jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: '7d' });

        const hashedRefresh = await bcrypt.hash(refreshToken, 10);
        await this.userService.update(user.id, { refreshToken: hashedRefresh });
        
        return { accessToken, refreshToken, user };

    }

    async login(input: LoginInput): Promise<AuthResponse> {
        const user = await this.userService.findByEmail(input.email);
        if (!user || !(await bcrypt.compare(input.password, user.password))) {
            throw new Error('Email hoặc mật khẩu không đúng');
        }

        const accessToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

        const hashedRefresh = await bcrypt.hash(refreshToken, 10);
        await this.userService.update(user.id, { refreshToken: hashedRefresh });

        return { accessToken, refreshToken, user };
    }

    async getUserProfile(id: string){
      return this.userService.findById(id);
    }

    async handleOAuth(input: OAuthInput): Promise<AuthResponse> {
        let user = await this.userService.findByEmail(input.email);
        if (!user) {
            user = await this.userService.create({
                name: input.name,
                email: input.email,
                avatar: input.avatar,
                password: '', // hoặc null
            });
        }
        const accessToken = this.jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign({ sub: user.id, email: user.email }, { expiresIn: '7d' });

        const hashedRefresh = await bcrypt.hash(refreshToken, 10);
        await this.userService.update(user.id, { refreshToken: hashedRefresh });
        
        return { accessToken, refreshToken: accessToken, user };
    }

    async refreshTokenFlow(token: string): Promise<AuthResponse> {
        let payload: any;
        try {
            payload = this.jwtService.verify(token);
        } catch {
            throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
        }

        const user = await this.userService.findById(payload.sub);
        if (!user || !user.refreshToken) throw new Error('Không tìm thấy người dùng');

        const isMatch = await bcrypt.compare(token, user.refreshToken);
        if (!isMatch) throw new Error('Refresh token không khớp');

        const newAccessToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '1h' });
        return { accessToken: newAccessToken, refreshToken: token, user };
    }
    
}