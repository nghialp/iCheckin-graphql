import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Checkin } from 'src/checkin/checkin.entity';

@ObjectType()
@Entity()
export class Place {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address?: string;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  types?: string[];

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  rating?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  mapboxId?: string;

  @Column({ nullable: true })
  @Field(() => Float)
  lat: number;

  @Column({ nullable: true })
  @Field(() => Float)
  lng: number;

  @OneToMany(() => Checkin, checkin => checkin.place)
  checkins: Checkin[];
}
