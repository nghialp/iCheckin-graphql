import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './voucher.entity';
import { User } from 'src/user/entities/user.entity';
import { VoucherService } from './voucher.service';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, User])],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule {}
