import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@ObjectType()
@Entity()
export class PointLedger {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @Field()
  @Column()
  action: string;

  @Field()
  @Column()
  points: number;

  @Field()
  @Column()
  timestamp: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reference?: string;
}