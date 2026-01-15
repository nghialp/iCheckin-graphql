import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Checkin } from 'src/checkin/checkin.entity';

@ObjectType()
@Entity()
@Unique('UQ_user_checkin_favorite', ['user', 'checkin'])
export class CheckinFavorite {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.favoriteCheckins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @ManyToOne(() => Checkin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checkin_id' })
  @Field(() => Checkin)
  checkin: Checkin;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
