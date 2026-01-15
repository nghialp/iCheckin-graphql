import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Trip } from '../trip.entity';
import { CollaboratorRole } from '../trip-collaborator.entity';

@ObjectType()
export class CollaboratorResponse {
  @Field(() => ID)
  id: string;

  @Field(() => Trip)
  trip: Trip;

  @Field(() => User)
  user: User;

  @Field()
  role: CollaboratorRole;

  @Field({ nullable: true })
  invitedBy?: string;

  @Field()
  isAccepted: boolean;

  @Field()
  invitedAt: Date;

  @Field({ nullable: true })
  acceptedAt?: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class CollaboratorsListResponse {
  @Field(() => [CollaboratorResponse])
  collaborators: CollaboratorResponse[];

  @Field()
  total: number;
}
