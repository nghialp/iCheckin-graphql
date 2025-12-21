import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';

@ObjectType()
@Entity()
export class Checkin {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.checkins)
  user: User;

  @Field()
  @Column()
  location: string; // tên địa điểm hoặc mã sự kiện

  @Field({ nullable: true })
  @Column({ nullable: true })
  note?: string;

  @Field()
  @CreateDateColumn()
  checkedAt: Date;
}