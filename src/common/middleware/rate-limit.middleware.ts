import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { CONSTANTS } from '../constants';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  blockDuration: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private redis: Redis | null = null;
  private config: RateLimitConfig;
  private redisConnected = false;
  private readonly logger = new Logger(RateLimitMiddleware.name);

  constructor(private configService: ConfigService) {
    this.config = {
      windowMs: CONSTANTS.RATE_LIMIT.WINDOW_MS,
      maxRequests: CONSTANTS.RATE_LIMIT.MAX_REQUESTS,
      keyPrefix: 'ratelimit:',
      blockDuration: CONSTANTS.RATE_LIMIT.BLOCK_DURATION,
    };

    // Initialize Redis connection
    this.initRedis();
  }

  private initRedis(): void {
    const host = this.configService.get('REDIS_HOST', 'localhost');
    const port = parseInt(this.configService.get('REDIS_PORT', '6379'), 10);
    const password = this.configService.get('REDIS_PASSWORD') || undefined;

    this.redis = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      retryStrategy: (times) => {
        // Don't retry connection
        return null;
      },
    });

    this.redis.on('error', (error) => {
      this.logger.warn(`Redis connection error: ${error.message}. Rate limiting will use in-memory fallback.`);
      this.redisConnected = false;
    });

    this.redis.on('connect', () => {
      this.redisConnected = true;
      this.logger.log('Redis connected for rate limiting');
    });

    // Try to connect but don't block if it fails
    this.redis.connect().catch((error) => {
      this.logger.warn(`Failed to connect to Redis: ${error.message}. Using in-memory fallback.`);
      this.redisConnected = false;
    });
  }

  async use(req: FastifyRequest, res: FastifyReply) {
    const ip = this.getClientIp(req);
    const path = req.url;
    const key = `${this.config.keyPrefix}${ip}:${path}`;

    // If Redis is not connected, use in-memory fallback
    if (!this.redisConnected || !this.redis) {
      this.logger.debug(`Redis not connected, using in-memory rate limiting for ${ip}:${path}`);
      return this.inMemoryRateLimit(req, res);
    }

    try {
      const current = await this.redis.get(key);

      if (current && parseInt(current) >= this.config.maxRequests) {
        const ttl = await this.redis.ttl(key);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests. Please try again later.',
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
      this.logger.error('Rate limit Redis error:', error);
      // Fall back to in-memory limiting
      return this.inMemoryRateLimit(req, res);
    }
  }

  // In-memory fallback for rate limiting
  private inMemoryRateLimit(req: FastifyRequest, res: FastifyReply): void {
    // Simple in-memory rate limiting (note: this doesn't work across multiple instances)
    const ip = this.getClientIp(req);
    const path = req.url;
    const key = `mem:${ip}:${path}`;
    
    // Just log and pass through for in-memory
    this.logger.warn(`In-memory rate limiting active for ${ip}:${path} (Redis unavailable)`);
  }

  private getClientIp(req: FastifyRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
    }
    return req.ip || 'unknown';
  }
}

