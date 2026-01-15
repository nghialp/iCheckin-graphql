import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './reward.entity';
import { RewardService } from './reward.service';
import { RewardResolver } from './reward.resolver';
import { User } from 'src/user/entities/user.entity';
import { PointLedger } from 'src/pointledger/pointledger.entity';
import { PointLedgerModule } from 'src/pointledger/pointledger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reward, User, PointLedger]),
    PointLedgerModule,
  ],
  providers: [RewardService, RewardResolver],
  exports: [RewardService],
})
export class RewardModule {}
