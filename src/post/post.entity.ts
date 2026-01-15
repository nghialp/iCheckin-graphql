import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Media } from 'src/media/media.entity';
import { Place } from 'src/place/place.entity';
import { Comment } from 'src/comment/comment.entity';
import { Trip } from 'src/trip/trip.entity';

@ObjectType()
@Entity()
export class Post {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, user => user.posts)
    @JoinColumn({ name: 'user_id' })
    @Field(() => User)
    user: User;

    @ManyToOne(() => Place, { nullable: true })
    @JoinColumn({ name: 'place_id' })
    @Field(() => Place, { nullable: true })
    place?: Place;

    @ManyToOne(() => Trip, trip => trip.posts, { nullable: true })
    @JoinColumn({ name: 'trip_id' })
    @Field(() => Trip, { nullable: true })
    trip?: Trip;

    @Field()
    @Column()
    content: string;

    @Field(() => [String], { nullable: true })
    @Column('simple-array', { nullable: true })
    tags?: string[];

    @Field({ nullable: true })
    @Column({ type: 'decimal', nullable: true })
    cost?: number;

    @Field({ nullable: true })
    @Column({ type: 'decimal', nullable: true })
    rating?: number;

    @OneToMany(() => Media, media => media.post)
    @Field(() => [Media], { nullable: true })
    media?: Media[];

    @OneToMany(() => Comment, comment => comment.post)
    comments: Comment[];

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
}