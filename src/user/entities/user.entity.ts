import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Checkin } from "../../checkin/checin.entity";
import { Friendship } from "../../friendships/friendship.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
@Entity()
export class User {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid') // dùng UUID thay vì số nguyên
    id: string;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column({ unique: true })
    email: string;

    @Field()
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

    @Field()
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
}


