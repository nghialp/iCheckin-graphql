import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Reward {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  type: string;

  @Field()
  @Column()
  description: string;

  @Field()
  @Column()
  required_points: number;

  @Field()
  @Column()
  stock: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  partner?: string;
}