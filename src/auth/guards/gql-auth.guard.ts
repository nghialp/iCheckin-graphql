import { ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(GqlAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();

    // Get authorization header
    const authorization = gqlContext.req?.headers?.authorization || 
                         gqlContext.request?.headers?.authorization;

    this.logger.debug(`Authorization header: ${authorization ? 'Present' : 'Missing'}`);

    if (!authorization) {
      this.logger.warn('No authorization header found');
      throw new UnauthorizedException('No authorization header provided');
    }

    return super.canActivate(context);
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();

    // Get the request object (works with both Express and Fastify)
    const req = gqlContext.req || gqlContext.request;

    if (!req) {
      this.logger.error('GqlAuthGuard: No request object found in context');
      throw new UnauthorizedException('Invalid context');
    }

    this.logger.debug(`Request object found, has authorization: ${!!req.headers?.authorization}`);

    // The user will be attached by Passport JWT strategy after validation
    // If user is not attached, it means JWT validation failed
    if (!req.user) {
      this.logger.debug('GqlAuthGuard: Waiting for Passport JWT validation...');
      // This will be populated after Passport validates the JWT
    } else {
      this.logger.debug(`User authenticated: ${req.user?.id || req.user?.userId || 'unknown'}`);
      // Attach user to context for easier access in decorators
      gqlContext.user = req.user;
      if (gqlContext.request) {
        gqlContext.request.user = req.user;
      }
    }

    return req;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      this.logger.error(`JWT error: ${err.message}`);
      throw err;
    }

    if (!user) {
      this.logger.error(`JWT validation failed: ${info?.message || 'Unknown error'}`);
      throw new UnauthorizedException(`Authentication failed: ${info?.message || 'Invalid token'}`);
    }

    this.logger.debug(`JWT validation success for user: ${user.id || user.userId}`);
    return user;
  }
}
