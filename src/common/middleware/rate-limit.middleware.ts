import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  blockDuration: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private redis: Redis;
  private config: RateLimitConfig;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: parseInt(this.configService.get('REDIS_PORT', '6379'), 10),
      password: this.configService.get('REDIS_PASSWORD') || undefined,
      lazyConnect: true,
    });

    this.config = {
      windowMs: parseInt(this.configService.get('RATE_LIMIT_WINDOW_MS', '60000'), 10),
      maxRequests: parseInt(this.configService.get('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
      keyPrefix: 'ratelimit:',
      blockDuration: parseInt(this.configService.get('RATE_LIMIT_BLOCK_DURATION', '300'), 10),
    };
  }

  async use(req: FastifyRequest, res: FastifyReply) {
    try {
      await this.redis.connect();
    } catch (error) {
      // Redis not available, skip rate limiting
      return;
    }

    const ip = this.getClientIp(req);
    const path = req.url;
    const key = `${this.config.keyPrefix}${ip}:${path}`;

    try {
      const current = await this.redis.get(key);

      if (current && parseInt(current) >= this.config.maxRequests) {
        const ttl = await this.redis.ttl(key);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${Math.ceil(ttl)} giây.`,
            retryAfter: ttl,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      await this.redis.incr(key);
      
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        await this.redis.expire(key, Math.ceil(this.config.windowMs / 1000));
      }

      res.header('X-RateLimit-Limit', this.config.maxRequests);
      res.header('X-RateLimit-Remaining', this.config.maxRequests - (parseInt(current || '0') + 1));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Rate limit Redis error:', error);
    }
  }

  private getClientIp(req: FastifyRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
    }
    return req.ip || 'unknown';
  }
}

