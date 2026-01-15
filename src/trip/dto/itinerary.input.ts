import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreateItineraryInput {
  @Field(() => ID)
  tripId: string;

  @Field()
  dayNumber: number;

  @Field()
  date: Date;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class UpdateItineraryInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class CreateActivityInput {
  @Field(() => ID)
  itineraryId: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  startTime: string; // HH:MM format

  @Field()
  endTime: string; // HH:MM format

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  placeId?: string;

  @Field({ nullable: true })
  category?: string; // breakfast, lunch, dinner, activity, transport, accommodation, etc.

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  estimatedCost?: number;

  @Field({ nullable: true })
  priority?: number;
}

@InputType()
export class UpdateActivityInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  startTime?: string;

  @Field({ nullable: true })
  endTime?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  placeId?: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  estimatedCost?: number;

  @Field({ nullable: true })
  isCompleted?: boolean;

  @Field({ nullable: true })
  priority?: number;
}
