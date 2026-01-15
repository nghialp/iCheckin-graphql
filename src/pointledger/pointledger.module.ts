import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointLedger } from './pointledger.entity';
import { Reward } from 'src/reward/reward.entity';
import { Voucher } from 'src/voucher/voucher.entity';
import { User } from 'src/user/entities/user.entity';
import { Place } from 'src/place/place.entity';
import { PointLedgerService } from './pointledger.service';
import { PointLedgerResolver } from './pointledger.resolver';
import { VoucherModule } from 'src/voucher/voucher.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointLedger, Reward, Voucher, User, Place]),
    VoucherModule,
  ],
  providers: [PointLedgerService, PointLedgerResolver],
  exports: [PointLedgerService],
})
export class PointLedgerModule {}
