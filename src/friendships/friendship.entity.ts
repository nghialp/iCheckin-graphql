import { User } from "../user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Field, ID, ObjectType } from "@nestjs/graphql";
import { FriendshipStatus } from "./friendship-status.enum";

@ObjectType()
@Entity()
export class Friendship {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => User)
    @ManyToOne(() => User, user => user.sentFriendRequests)
    requester: User;

    @Field(() => User)
    @ManyToOne(() => User, user => user.receivedFriendRequests)
    recipient: User;

    @Field(() => FriendshipStatus)
    @Column({
        type: 'enum',
        enum: FriendshipStatus,
        default: FriendshipStatus.PENDING,
    })
    status: FriendshipStatus;

    @Field()
    @CreateDateColumn()
    createdAt: Date;
}