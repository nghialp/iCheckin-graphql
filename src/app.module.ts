import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { FriendshipModule } from './friendships/friendship.module';
import { CheckinModule } from './checkin/checkin.module';
import { MailModule } from './mail/mail.module';
import { CommentModule } from './comment/comment.module';
import { PlaceModule } from './place/place.module';
import { PostModule } from './post/post.module';
import { MediaModule } from './media/media.module';
import { RewardModule } from './reward/reward.module';
import { UsefulVoteModule } from './usefulvote/usefulvote.module';
import { TripModule } from './trip/trip.module';
import { PointLedgerModule } from './pointledger/pointledger.module';
import { VoucherModule } from './voucher/voucher.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        store: redisStore,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        auth_pass: process.env.REDIS_PASSWORD || undefined,
        ttl: 60, // thời gian cache mặc định (giây)
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        playground: configService.get('NODE_ENV') !== 'production', // Disable playground in production
        introspection: configService.get('NODE_ENV') !== 'production',
        formatError: (error) => {
          // Sanitize error messages in production
          const isProduction = configService.get('NODE_ENV') === 'production';
          if (isProduction && !error.extensions?.code) {
            return {
              message: 'An error occurred',
              extensions: { code: 'INTERNAL_SERVER_ERROR' },
            };
          }
          return error;
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // Disable synchronize in production to prevent data loss
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),
    UserModule,
    AuthModule,
    FriendshipModule,
    CheckinModule,
    CommentModule,
    PlaceModule,
    PostModule,
    MediaModule,
    RewardModule,
    UsefulVoteModule,
    TripModule,
    PointLedgerModule,
    VoucherModule,
    MailModule,
    CommonModule,
  ],
})
export class AppModule {}
