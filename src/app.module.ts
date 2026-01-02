import { Module,  } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // chỉ dùng cho dev
    }),
    UserModule,
    AuthModule,
    FriendshipModule,
    CheckinModule,
    CommentModule,
    PlaceModule,
    PostModule,
    MailModule,
    CommonModule,
  ],
})
export class AppModule {}
