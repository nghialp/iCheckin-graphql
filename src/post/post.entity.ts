import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Media } from 'src/media/media.entity';
import { Place } from 'src/place/place.entity';
import { Comment } from 'src/comment/comment.entity';

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
    @Column({ type: 'timestamp' })
    createdAt: Date;
}