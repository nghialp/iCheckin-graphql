import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthService } from "./auth.service";
import { AuthResponse } from "./dto/auth.response";
import { SignupInput } from "./dto/signup.input";
import { LoginInput } from "./dto/login.input";
import { UseGuards } from "@nestjs/common";
import { User } from "src/user/entities/user.entity";
import { CurrentUser } from "./decorators/current-user.decorator";
import { GqlAuthGuard } from "./guards/gql-auth.guard";
import { OAuthInput } from "./dto/oauth.input";

@Resolver()
export class AuthResolver {
    constructor(private authService: AuthService) {}

    @Mutation(() => AuthResponse)
    signup(@Args('input') input: SignupInput) {
        return this.authService.signup(input);
    }

    @Mutation(() => AuthResponse)
    login(@Args('input') input: LoginInput) {
        return this.authService.login(input);
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => User)
    getProfile(@CurrentUser() user: any) {
        return this.authService.getUserProfile(user.userId);
    }

    @Mutation(() => AuthResponse)
    async oauthLogin(@Args('input') input: OAuthInput) {
        return this.authService.handleOAuth(input);
    }

    @Mutation(() => AuthResponse)
    async refreshToken(@Args('token') token: string) {
        return this.authService.refreshTokenFlow(token);
    }
}