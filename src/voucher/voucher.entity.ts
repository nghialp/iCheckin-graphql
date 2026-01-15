import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Reward } from 'src/reward/reward.entity';

@ObjectType()
@Entity()
export class Voucher {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Reward)
  @ManyToOne(() => Reward, reward => reward.vouchers, { onDelete: 'CASCADE' })
  reward: Reward;

  @Field()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Field()
  @Column({ unique: true })
  voucher_code: string; // Generated code

  @Field()
  @Column()
  qr_code: string; // QR code URL or data

  @Field()
  @Column()
  redeem_date: Date; // When user redeemed

  @Field({ nullable: true })
  @Column({ nullable: true })
  expiry_date?: Date;

  @Field()
  @Column({ default: 'unused' })
  status: string; // unused, used, expired

  @Field({ nullable: true })
  @Column({ nullable: true })
  used_date?: Date; // When voucher was actually used

  @Field({ nullable: true })
  @Column({ nullable: true })
  note?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
