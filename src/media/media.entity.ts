import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from 'src/post/post.entity';

@ObjectType()
@Entity()
export class Media {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, post => post.media)
  @JoinColumn({ name: 'post_id' })
  @Field(() => Post)
  post: Post;

  @Field()
  @Column()
  type: string;

  @Field()
  @Column()
  url: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  size?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  checksum?: string;
}
