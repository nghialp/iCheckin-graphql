import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class ItineraryActivityResponse {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  startTime: string;

  @Field()
  endTime: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  placeId?: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Float, { nullable: true })
  estimatedCost?: number;

  @Field()
  isCompleted: boolean;

  @Field(() => Number, { nullable: true })
  priority?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class ItineraryResponse {
  @Field(() => ID)
  id: string;

  @Field()
  dayNumber: number;

  @Field()
  date: Date;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [ItineraryActivityResponse], { nullable: true })
  activities?: ItineraryActivityResponse[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class ActivityScheduleConflict {
  @Field()
  conflictType: string; // 'time_overlap', 'invalid_time_range', 'duplicate_activity'

  @Field()
  message: string;

  @Field(() => [ItineraryActivityResponse], { nullable: true })
  conflictingActivities?: ItineraryActivityResponse[];
}

@ObjectType()
export class ItineraryStatsResponse {
  @Field()
  dayNumber: number;

  @Field()
  date: Date;

  @Field()
  totalActivities: number;

  @Field()
  completedActivities: number;

  @Field(() => Float)
  totalEstimatedCost: number;

  @Field()
  firstActivityTime: string;

  @Field()
  lastActivityTime: string;

  @Field(() => [String])
  categories: string[];

  @Field()
  scheduleUtilization: number; // percentage of day scheduled
}
