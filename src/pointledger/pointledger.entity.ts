import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Reward } from 'src/reward/reward.entity';
import { Voucher } from 'src/voucher/voucher.entity';
import { Place } from 'src/place/place.entity';

@ObjectType()
@Entity()
export class PointLedger {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  transaction_id: string;

  @Field()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column()
  action_type: string; // check-in, review, like, comment, share, reward, bonus, redemption

  @Field()
  @Column()
  points_change: number; // Positive for earning, negative for spending

  @Field()
  @Column()
  balance_after: number; // Balance after this transaction

  @Field({ nullable: true })
  @ManyToOne(() => Place, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'location_id' })
  location?: Place;

  @Field({ nullable: true })
  @ManyToOne(() => Reward, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reward_id' })
  reward?: Reward;

  @Field({ nullable: true })
  @ManyToOne(() => Voucher, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'voucher_id' })
  voucher?: Voucher;

  @Field({ nullable: true })
  @Column({ nullable: true })
  note?: string;

  @Field()
  @CreateDateColumn()
  timestamp: Date;
  
}