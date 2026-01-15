import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/post.entity';
import { Place } from 'src/place/place.entity';
import { TripCollaborator } from './trip-collaborator.entity';
import { TripItinerary } from './trip-itinerary.entity';

@ObjectType()
@Entity()
export class Trip {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.trips)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column({ type: 'date' })
  start_date: Date;

  @Field()
  @Column({ type: 'date' })
  end_date: Date;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  locations?: string[];

  @ManyToMany(() => Place, place => place.trips)
  @JoinTable({
    name: 'trip_places',
    joinColumn: { name: 'trip_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'place_id', referencedColumnName: 'id' },
  })
  @Field(() => [Place], { nullable: true })
  places?: Place[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  status?: string; // planning, ongoing, completed

  @OneToMany(() => Post, post => post.trip, { nullable: true })
  @Field(() => [Post], { nullable: true })
  posts?: Post[];

  @OneToMany(() => TripCollaborator, collaborator => collaborator.trip)
  @Field(() => [TripCollaborator], { nullable: true })
  collaborators?: TripCollaborator[];

  @OneToMany(() => TripItinerary, itinerary => itinerary.trip)
  @Field(() => [TripItinerary], { nullable: true })
  itineraries?: TripItinerary[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  checkin_list?: string[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}