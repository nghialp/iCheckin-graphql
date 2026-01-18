import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checkin } from './checkin.entity';
import { CheckinService } from './checkin.service';
import { CheckinResolver } from './checkin.resolver';
import { PlaceModule } from 'src/place/place.module';
import { FriendshipModule } from 'src/friendships/friendship.module';


@Module({
  imports: [TypeOrmModule.forFeature([Checkin]), PlaceModule, FriendshipModule],
  providers: [CheckinService, CheckinResolver],
  exports: [CheckinService],
})
export class CheckinModule {}
