import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, OneToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../user/entities/user.entity';
import { Place } from 'src/place/place.entity';
import { Mood } from 'src/common/enums/mood.enum';
import { CheckinLike } from './checkin-like.entity';
import { CheckinComment } from './checkin-comment.entity';

@ObjectType()
@Entity()
export class Checkin {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.checkins)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @ManyToOne(() => Place, place => place.checkins)
  @JoinColumn({ name: 'place_id' })
  @Field(() => Place)
  place: Place;

  @Field()
  @CreateDateColumn()
  checkedAt: Date;

  @Field()
  @Column()
  status: string;

  @Field(() => Mood, { nullable: true })
  @Column({
    type: 'enum',
    enum: Mood,
    nullable: true,
    default: null
  })
  mood?: Mood;

  @OneToMany(() => CheckinLike, like => like.checkin)
  @Field(() => [CheckinLike], { nullable: true })
  likes?: CheckinLike[];

  @OneToMany(() => CheckinComment, comment => comment.checkin)
  @Field(() => [CheckinComment], { nullable: true })
  comments?: CheckinComment[];
}
