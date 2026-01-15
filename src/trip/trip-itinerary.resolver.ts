import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ItineraryService } from './trip-itinerary.service';
import { TripItinerary, ItineraryActivity } from './trip-itinerary.entity';
import { ItineraryResponse, ItineraryActivityResponse, ItineraryStatsResponse } from './dto/itinerary.response';
import { CreateItineraryInput, UpdateItineraryInput, CreateActivityInput, UpdateActivityInput } from './dto/itinerary.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Resolver(() => TripItinerary)
export class ItineraryResolver {
  constructor(private itineraryService: ItineraryService) {}

  // ==================== Itinerary Resolvers ====================

  @Mutation(() => ItineraryResponse, { description: 'Create a new daily itinerary for a trip' })
  @UseGuards(GqlAuthGuard)
  async createItinerary(
    @Args('input') input: CreateItineraryInput,
    @CurrentUser() user: User,
  ): Promise<TripItinerary> {
    return this.itineraryService.createItinerary(input, user.id);
  }

  @Mutation(() => ItineraryResponse, { description: 'Update an existing itinerary' })
  @UseGuards(GqlAuthGuard)
  async updateItinerary(
    @Args('input') input: UpdateItineraryInput,
    @CurrentUser() user: User,
  ): Promise<TripItinerary> {
    return this.itineraryService.updateItinerary(input, user.id);
  }

  @Mutation(() => Boolean, { description: 'Delete an itinerary and all its activities' })
  @UseGuards(GqlAuthGuard)
  async deleteItinerary(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.itineraryService.deleteItinerary(id, user.id);
  }

  @Query(() => [ItineraryResponse], { description: 'Get all itineraries for a trip (sorted by day)' })
  async tripItineraries(@Args('tripId', { type: () => ID }) tripId: string): Promise<TripItinerary[]> {
    return this.itineraryService.getTripItineraries(tripId);
  }

  @Query(() => ItineraryResponse, { description: 'Get itinerary for a specific day' })
  async itineraryByDay(
    @Args('tripId', { type: () => ID }) tripId: string,
    @Args('dayNumber') dayNumber: number,
  ): Promise<TripItinerary> {
    return this.itineraryService.getItineraryByDay(tripId, dayNumber);
  }

  // ==================== Activity Resolvers ====================

  @Mutation(() => ItineraryActivityResponse, { description: 'Create a new activity in an itinerary' })
  @UseGuards(GqlAuthGuard)
  async createActivity(
    @Args('input') input: CreateActivityInput,
    @CurrentUser() user: User,
  ): Promise<ItineraryActivity> {
    return this.itineraryService.createActivity(input, user.id);
  }

  @Mutation(() => ItineraryActivityResponse, { description: 'Update an existing activity' })
  @UseGuards(GqlAuthGuard)
  async updateActivity(
    @Args('input') input: UpdateActivityInput,
    @CurrentUser() user: User,
  ): Promise<ItineraryActivity> {
    return this.itineraryService.updateActivity(input, user.id);
  }

  @Mutation(() => Boolean, { description: 'Delete an activity from an itinerary' })
  @UseGuards(GqlAuthGuard)
  async deleteActivity(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.itineraryService.deleteActivity(id, user.id);
  }

  @Mutation(() => ItineraryActivityResponse, { description: 'Mark an activity as complete' })
  @UseGuards(GqlAuthGuard)
  async markActivityComplete(
    @Args('activityId', { type: () => ID }) activityId: string,
    @CurrentUser() user: User,
  ): Promise<ItineraryActivity> {
    return this.itineraryService.markActivityComplete(activityId, user.id);
  }

  @Query(() => [ItineraryActivityResponse], { description: 'Get all activities for an itinerary (sorted by time)' })
  async itineraryActivities(@Args('itineraryId', { type: () => ID }) itineraryId: string): Promise<ItineraryActivity[]> {
    return this.itineraryService.getItineraryActivities(itineraryId);
  }

  // ==================== Statistics Resolvers ====================

  @Query(() => ItineraryStatsResponse, { description: 'Get statistics for a specific itinerary' })
  async itineraryStats(@Args('itineraryId', { type: () => ID }) itineraryId: string): Promise<ItineraryStatsResponse> {
    return this.itineraryService.getItineraryStats(itineraryId);
  }

  @Query(() => [ItineraryStatsResponse], { description: 'Get statistics for all itineraries in a trip' })
  async tripItineraryStats(@Args('tripId', { type: () => ID }) tripId: string): Promise<ItineraryStatsResponse[]> {
    return this.itineraryService.getTripItineraryStats(tripId);
  }
}
