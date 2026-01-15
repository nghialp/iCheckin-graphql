import { Module } from '@nestjs/common';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { MapboxPlacesService } from './services/mapbox-places.service';
import { MapboxProxyController } from './controllers/mapbox-proxy.controller';
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
	controllers: [MapboxProxyController],
	providers: [
		RateLimitMiddleware,
		MapboxPlacesService,
	],
	exports: [
		RateLimitMiddleware,
		MapboxPlacesService,
	],
})
export class CommonModule { }

