import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../user/entities/user.entity';
import { Place } from 'src/place/place.entity';

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

  @Field({ nullable: true })
  @Column({ nullable: true })
  mood?: string;
}
