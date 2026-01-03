import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Checkin } from "../../checkin/checkin.entity";
import { Friendship } from "../../friendships/friendship.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Post } from "src/post/post.entity";

@ObjectType()
@Entity()
export class User {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    avatar?: string;

    @Field()
    @Column({ default: 0 })
    points: number;

    @Field()
    @Column({ default: 1 })
    level: number;

    @Column({ nullable: true })
    refreshToken?: string;

    @Field(() => [Friendship])
    @OneToMany(() => Friendship, f => f.requester)
    sentFriendRequests: Friendship[];

    @Field(() => [Checkin])
    @OneToMany(() => Checkin, checkin => checkin.user)
    checkins: Checkin[];

    @Field(() => [Friendship])
    @OneToMany(() => Friendship, f => f.recipient)
    receivedFriendRequests: Friendship[];
    
    @Field({ nullable: true })
    @Column({ nullable: true })
    bio?: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    country?: string;

    @Field(() => [String], { nullable: true })
    @Column('simple-array', { nullable: true })
    interests?: string[];

    @Field({ nullable: true })
    @Column({ nullable: true })
    privacy_settings?: string;

    @OneToMany(() => Post, post => post.user)
    posts: Post[];

    // Timestamps for tracking
    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    // Soft delete support
    @Field({ nullable: true })
    @DeleteDateColumn()
    deletedAt?: Date;
}
