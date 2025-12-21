import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checkin } from './checin.entity';
import { CheckinService } from './checkin.service';
import { CheckinResolver } from './checkin.resolver';


@Module({
  imports: [TypeOrmModule.forFeature([Checkin])],
  providers: [CheckinService, CheckinResolver],
  exports: [CheckinService],
})
export class CheckinModule {}