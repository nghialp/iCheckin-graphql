import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Checkin } from 'src/checkin/checin.entity';

@ObjectType()
@Entity()
export class Place {
@Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Tên địa điểm (Google Maps name)
  @Field()
  @Column()
  name: string;

  // Địa chỉ đầy đủ (formatted_address hoặc vicinity)
  @Field({ nullable: true })
  @Column({ nullable: true })
  address?: string;

  // Loại địa điểm (ví dụ: cafe, restaurant, park…)
  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  types?: string[];

  // Rating từ Google Maps
  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  rating?: number;

  // Thumbnail (Google photo reference → URL)
  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail?: string;

  // Google Place ID (để tham chiếu lại API)
  @Field({ nullable: true })
  @Column({ nullable: true })
  googlePlaceId?: string;

  @Column({ nullable: true })
  @Field(() => Float)
	lat: number;

  @Column({ nullable: true })
	@Field(() => Float)
	lng: number;

  @OneToMany(() => Checkin, checkin => checkin.place)
  checkins: Checkin[];
}
