import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Place } from 'src/place/place.entity';

@ObjectType()
@Entity()
@Unique('UQ_user_place_favorite', ['user', 'place'])
export class PlaceFavorite {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.favoritePlaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @ManyToOne(() => Place, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'place_id' })
  @Field(() => Place)
  place: Place;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
