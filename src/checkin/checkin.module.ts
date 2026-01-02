import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checkin } from './checin.entity';
import { CheckinService } from './checkin.service';
import { CheckinResolver } from './checkin.resolver';
import { PlaceModule } from 'src/place/place.module';


@Module({
  imports: [TypeOrmModule.forFeature([Checkin]), PlaceModule],
  providers: [CheckinService, CheckinResolver],
  exports: [CheckinService],
})
export class CheckinModule {}