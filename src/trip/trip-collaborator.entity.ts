import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Column, Unique } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Trip } from './trip.entity';
import { User } from 'src/user/entities/user.entity';

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

@ObjectType()
@Entity()
@Unique('UQ_trip_user', ['trip', 'user'])
export class TripCollaborator {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, trip => trip.collaborators, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  @Field(() => Trip)
  trip: Trip;

  @ManyToOne(() => User, user => user.tripCollaborations)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @Field()
  @Column({ type: 'enum', enum: CollaboratorRole, default: CollaboratorRole.VIEWER })
  role: CollaboratorRole;

  @Field({ nullable: true })
  @Column({ nullable: true })
  invitedBy?: string; // User ID of who invited

  @Field()
  @Column({ default: false })
  isAccepted: boolean;

  @Field()
  @CreateDateColumn()
  invitedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  acceptedAt?: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
