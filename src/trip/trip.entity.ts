import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@ObjectType()
@Entity()
export class Trip {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @Field()
  @Column()
  start_date: Date;

  @Field()
  @Column()
  end_date: Date;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  checkin_list?: string[];
}