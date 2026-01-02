import { Module } from '@nestjs/common';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { GooglePlacesCacheService } from './services/google-places-cache.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [
		CacheModule.register({
			ttl: 60, // thời gian cache mặc định (giây)
			max: 100, // số lượng items tối đa
		}),
		ConfigModule,
	],
	providers: [
		RateLimitMiddleware,
		GooglePlacesCacheService,
	],
	exports: [
		RateLimitMiddleware,
		GooglePlacesCacheService,
	],
})
export class CommonModule { }

