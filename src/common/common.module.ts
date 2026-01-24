import { Module, Global } from '@nestjs/common';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { MapboxPlacesService } from './services/mapbox-places.service';
import { MapboxProxyController } from './controllers/mapbox-proxy.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { PubSubService, PUB_SUB } from './services/pub-sub.service';

@Global()
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
		{
			provide: PUB_SUB,
			useClass: PubSubService,
		},
	],
	exports: [
		RateLimitMiddleware,
		MapboxPlacesService,
		PUB_SUB,
	],
})
export class CommonModule { }

