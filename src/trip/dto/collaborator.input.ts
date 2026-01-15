import { InputType, Field, ID } from '@nestjs/graphql';
import { CollaboratorRole } from '../trip-collaborator.entity';

@InputType()
export class InviteCollaboratorInput {
  @Field(() => ID)
  tripId: string;

  @Field()
  collaboratorEmail: string;

  @Field({ nullable: true })
  role?: CollaboratorRole;
}

@InputType()
export class UpdateCollaboratorRoleInput {
  @Field(() => ID)
  collaboratorId: string;

  @Field()
  role: CollaboratorRole;
}
