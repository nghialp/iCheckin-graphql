import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Voucher } from 'src/voucher/voucher.entity';

@ObjectType()
@Entity()
export class Reward {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column('text')
  description: string;

  @Field()
  @Column()
  category: string; // food, travel, service, entertainment

  @Field()
  @Column()
  points_required: number;

  @Field()
  @Column({ default: 100 })
  stock: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  expiry_date?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  partner_id?: string;

  @Field()
  @Column()
  image_url: string;

  @Field()
  @Column({ default: 'available' })
  status: string; // available, out_of_stock, expired

  @OneToMany(() => Voucher, voucher => voucher.reward)
  vouchers?: Voucher[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}