import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique, Column } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Checkin } from './checkin.entity';

@ObjectType()
@Entity()
@Unique('UQ_user_checkin_comment', ['user', 'checkin'])
export class CheckinComment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @ManyToOne(() => Checkin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checkin_id' })
  @Field(() => Checkin)
  checkin: Checkin;

  @Field()
  @Column('text')
  content: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  parent_id?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  updatedAt?: Date;
}

