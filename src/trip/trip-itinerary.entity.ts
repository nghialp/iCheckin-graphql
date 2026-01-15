import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Trip } from './trip.entity';

@ObjectType()
@Entity()
export class TripItinerary {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, trip => trip.itineraries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  @Field(() => Trip)
  trip: Trip;

  @Field()
  @Column()
  dayNumber: number; // 1, 2, 3, etc.

  @Field()
  @Column({ type: 'date' })
  date: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @OneToMany(() => ItineraryActivity, activity => activity.itinerary, { cascade: true })
  @Field(() => [ItineraryActivity], { nullable: true })
  activities?: ItineraryActivity[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

@ObjectType()
@Entity()
export class ItineraryActivity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TripItinerary, itinerary => itinerary.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itinerary_id' })
  @Field(() => TripItinerary)
  itinerary: TripItinerary;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Field()
  @Column()
  startTime: string; // HH:MM format

  @Field()
  @Column()
  endTime: string; // HH:MM format

  @Field({ nullable: true })
  @Column({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  placeId?: string; // Reference to Place entity

  @Field({ nullable: true })
  @Column({ nullable: true })
  category?: string; // breakfast, lunch, dinner, activity, transport, accommodation, etc.

  @Field({ nullable: true })
  @Column({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  estimatedCost?: number;

  @Field({ nullable: true })
  @Column({ default: false })
  isCompleted?: boolean;

  @Field(() => Number, { nullable: true })
  @Column({ nullable: true })
  priority?: number; // 1-5, higher = more important

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
