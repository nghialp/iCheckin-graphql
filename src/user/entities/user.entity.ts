import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Checkin } from "../../checkin/checkin.entity";
import { Friendship } from "../../friendships/friendship.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { Post } from "src/post/post.entity";
import { Trip } from "src/trip/trip.entity";
import { TripCollaborator } from "src/trip/trip-collaborator.entity";
import { Like } from "src/friendships/like.entity";
import { CheckinFavorite } from "src/friendships/checkin-favorite.entity";
import { PlaceFavorite } from "src/friendships/place-favorite.entity";
import { NotificationSettings, PrivacySettings, SecuritySettings } from "../dto/user-settings.dto";

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
    @Column({ default: 0 })
    points_balance: number;

    @Field()
    @Column({ default: 'BRONZE' })
    level: string; // BRONZE, SILVER, GOLD, PLATINUM

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

    @Field({ nullable: true })
    @Column({ nullable: true })
    phone?: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    dateOfBirth?: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    gender?: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    location?: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    hobby?: string;

    @Field(() => NotificationSettings, { nullable: true })
    @Column({ type: 'jsonb', nullable: true })
    notificationSettings?: NotificationSettings;

    @Field(() => PrivacySettings, { nullable: true })
    @Column({ type: 'jsonb', nullable: true })
    privacySettings?: PrivacySettings;

    @Field(() => SecuritySettings, { nullable: true })
    @Column({ type: 'jsonb', nullable: true })
    securitySettings?: SecuritySettings;

    @OneToMany(() => Post, post => post.user)
    posts: Post[];

    @Field(() => [Trip], { nullable: true })
    @OneToMany(() => Trip, trip => trip.user)
    trips: Trip[];

    @Field(() => [TripCollaborator], { nullable: true })
    @OneToMany(() => TripCollaborator, collaborator => collaborator.user)
    tripCollaborations: TripCollaborator[];

    @Field(() => [User], { nullable: true })
    @ManyToMany(() => User, user => user.followings)
    @JoinTable({
      name: 'user_followers',
      joinColumn: { name: 'follower_id', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'following_id', referencedColumnName: 'id' },
    })
    followers?: User[];

    @Field(() => [User], { nullable: true })
    @ManyToMany(() => User, user => user.followers)
    followings?: User[];

    @OneToMany(() => Like, like => like.user)
    @Field(() => [Like], { nullable: true })
    likes?: Like[];

    @OneToMany(() => CheckinFavorite, favorite => favorite.user)
    @Field(() => [CheckinFavorite], { nullable: true })
    favoriteCheckins?: CheckinFavorite[];

    @OneToMany(() => PlaceFavorite, favorite => favorite.user)
    @Field(() => [PlaceFavorite], { nullable: true })
    favoritePlaces?: PlaceFavorite[];

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
