import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TripService } from './trip.service';
import { Trip } from './trip.entity';
import { TripResponse, TripStatsResponse, TripPaginatedResponse } from './dto/trip.response';
import { PlaceStatsResponse } from './dto/place-stats.response';
import { CollaboratorResponse, CollaboratorsListResponse } from './dto/collaborator.response';
import { CreateTripInput } from './dto/create-trip.input';
import { UpdateTripInput } from './dto/update-trip.input';
import { InviteCollaboratorInput, UpdateCollaboratorRoleInput } from './dto/collaborator.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/post.entity';
import { Place } from 'src/place/place.entity';
import { TripCollaborator } from './trip-collaborator.entity';

@Resolver(() => Trip)
export class TripResolver {
  constructor(private tripService: TripService) {}

  @Mutation(() => TripResponse, { description: 'Create a new trip for authenticated user' })
  @UseGuards(GqlAuthGuard)
  async createTrip(
    @Args('input') createTripInput: CreateTripInput,
    @CurrentUser() user: User,
  ): Promise<Trip> {
    return this.tripService.createTrip(createTripInput, user.id);
  }

  @Mutation(() => TripResponse, { description: 'Update an existing trip' })
  @UseGuards(GqlAuthGuard)
  async updateTrip(
    @Args('input') updateTripInput: UpdateTripInput,
    @CurrentUser() user: User,
  ): Promise<Trip> {
    return this.tripService.updateTrip(updateTripInput, user.id);
  }

  @Mutation(() => Boolean, { description: 'Delete a trip' })
  @UseGuards(GqlAuthGuard)
  async deleteTrip(
    @Args('id', { type: () => ID }) tripId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.tripService.deleteTrip(tripId, user.id);
  }

  @Query(() => TripResponse, { description: 'Get a trip by ID' })
  async tripById(@Args('id', { type: () => ID }) tripId: string): Promise<Trip> {
    return this.tripService.getTripById(tripId);
  }

  @Query(() => TripPaginatedResponse, { description: 'Get all trips for authenticated user' })
  @UseGuards(GqlAuthGuard)
  async myTrips(
    @CurrentUser() user: User,
    @Args('page', { type: () => ID, nullable: true }) page?: number,
    @Args('limit', { type: () => ID, nullable: true }) limit?: number,
  ): Promise<TripPaginatedResponse> {
    const { trips, total } = await this.tripService.getUserTrips(user.id, page || 1, limit || 10);
    const totalPages = Math.ceil(total / (limit || 10));

    return {
      trips,
      total,
      page: page || 1,
      limit: limit || 10,
      totalPages,
    };
  }

  @Query(() => [TripResponse], { description: 'Get upcoming trips for authenticated user' })
  @UseGuards(GqlAuthGuard)
  async upcomingTrips(
    @CurrentUser() user: User,
    @Args('limit', { type: () => ID, nullable: true }) limit?: number,
  ): Promise<Trip[]> {
    return this.tripService.getUpcomingTrips(user.id, limit || 5);
  }

  @Query(() => [TripResponse], { description: 'Get past trips for authenticated user' })
  @UseGuards(GqlAuthGuard)
  async pastTrips(
    @CurrentUser() user: User,
    @Args('limit', { type: () => ID, nullable: true }) limit?: number,
  ): Promise<Trip[]> {
    return this.tripService.getPastTrips(user.id, limit || 5);
  }

  @Query(() => [TripResponse], { description: 'Get trips by specific month' })
  @UseGuards(GqlAuthGuard)
  async tripsByMonth(
    @CurrentUser() user: User,
    @Args('month', { type: () => ID }) month: number,
    @Args('year', { type: () => ID }) year: number,
  ): Promise<Trip[]> {
    return this.tripService.getTripsByMonth(user.id, month, year);
  }

  @Query(() => [Post], { description: 'Get all posts associated with a trip' })
  async tripPosts(@Args('tripId', { type: () => ID }) tripId: string): Promise<Post[]> {
    return this.tripService.getTripPosts(tripId);
  }

  @Query(() => TripStatsResponse, { description: 'Get statistics for a trip' })
  async tripStats(@Args('tripId', { type: () => ID }) tripId: string): Promise<TripStatsResponse> {
    return this.tripService.getTripStats(tripId);
  }

  @Mutation(() => Post, { description: 'Add a post to a trip' })
  @UseGuards(GqlAuthGuard)
  async addPostToTrip(
    @Args('tripId', { type: () => ID }) tripId: string,
    @Args('postId', { type: () => ID }) postId: string,
    @CurrentUser() user: User,
  ): Promise<Post> {
    return this.tripService.addPostToTrip(tripId, postId, user.id);
  }

  @Mutation(() => Post, { description: 'Remove a post from a trip' })
  @UseGuards(GqlAuthGuard)
  async removePostFromTrip(
    @Args('postId', { type: () => ID }) postId: string,
    @CurrentUser() user: User,
  ): Promise<Post> {
    return this.tripService.removePostFromTrip(postId, user.id);
  }

  @Mutation(() => TripResponse, { description: 'Update trip status' })
  @UseGuards(GqlAuthGuard)
  async updateTripStatus(
    @Args('tripId', { type: () => ID }) tripId: string,
    @Args('status') status: string,
    @CurrentUser() user: User,
  ): Promise<Trip> {
    return this.tripService.updateTripStatus(tripId, user.id, status);
  }

  @Mutation(() => TripResponse, { description: 'Add a location to trip' })
  @UseGuards(GqlAuthGuard)
  async addLocationToTrip(
    @Args('tripId', { type: () => ID }) tripId: string,
    @Args('location') location: string,
    @CurrentUser() user: User,
  ): Promise<Trip> {
    return this.tripService.addLocationToTrip(tripId, user.id, location);
  }

  @Mutation(() => TripResponse, { description: 'Remove a location from trip' })
  @UseGuards(GqlAuthGuard)
  async removeLocationFromTrip(
    @Args('tripId', { type: () => ID }) tripId: string,
    @Args('location') location: string,
    @CurrentUser() user: User,
  ): Promise<Trip> {
    return this.tripService.removeLocationFromTrip(tripId, user.id, location);
  }

  @Mutation(() => TripResponse, { description: 'Add a place to trip' })
  @UseGuards(GqlAuthGuard)
  async addPlaceToTrip(
    @Args('tripId', { type: () => ID }) tripId: string,
    @Args('placeId', { type: () => ID }) placeId: string,
    @CurrentUser() user: User,
  ): Promise<Trip> {
    return this.tripService.addPlaceToTrip(tripId, user.id, placeId);
  }

  @Mutation(() => TripResponse, { description: 'Remove a place from trip' })
  @UseGuards(GqlAuthGuard)
  async removePlaceFromTrip(
    @Args('tripId', { type: () => ID }) tripId: string,
    @Args('placeId', { type: () => ID }) placeId: string,
    @CurrentUser() user: User,
  ): Promise<Trip> {
    return this.tripService.removePlaceFromTrip(tripId, user.id, placeId);
  }

  @Query(() => [Place], { description: 'Get all places in a trip' })
  async tripPlaces(@Args('tripId', { type: () => ID }) tripId: string): Promise<Place[]> {
    return this.tripService.getTripPlaces(tripId);
  }

  @Query(() => [Trip], { description: 'Get all trips that contain a specific place' })
  async placeTrips(@Args('placeId', { type: () => ID }) placeId: string): Promise<Trip[]> {
    return this.tripService.getPlaceTrips(placeId);
  }

  @Query(() => PlaceStatsResponse, { description: 'Get statistics about places in a trip' })
  async tripPlacesStats(@Args('tripId', { type: () => ID }) tripId: string): Promise<PlaceStatsResponse> {
    const stats = await this.tripService.getTripPlacesStats(tripId);
    return {
      totalPlaces: stats.totalPlaces,
      avgRating: stats.avgRating,
      types: Array.from(stats.types),
    };
  }

  // ==================== Collaboration Resolvers ====================

  @Mutation(() => CollaboratorResponse, { description: 'Invite a collaborator to a trip' })
  @UseGuards(GqlAuthGuard)
  async inviteCollaborator(
    @Args('input') input: InviteCollaboratorInput,
    @CurrentUser() user: User,
  ): Promise<TripCollaborator> {
    return this.tripService.inviteCollaborator(input, user.id);
  }

  @Mutation(() => CollaboratorResponse, { description: 'Accept a collaboration invitation' })
  @UseGuards(GqlAuthGuard)
  async acceptInvitation(
    @Args('collaboratorId', { type: () => ID }) collaboratorId: string,
    @CurrentUser() user: User,
  ): Promise<TripCollaborator> {
    return this.tripService.acceptInvitation(collaboratorId, user.id);
  }

  @Mutation(() => Boolean, { description: 'Reject a collaboration invitation' })
  @UseGuards(GqlAuthGuard)
  async rejectInvitation(
    @Args('collaboratorId', { type: () => ID }) collaboratorId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.tripService.rejectInvitation(collaboratorId, user.id);
  }

  @Mutation(() => Boolean, { description: 'Remove a collaborator from a trip' })
  @UseGuards(GqlAuthGuard)
  async removeCollaborator(
    @Args('collaboratorId', { type: () => ID }) collaboratorId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.tripService.removeCollaborator(collaboratorId, user.id);
  }

  @Mutation(() => CollaboratorResponse, { description: 'Update a collaborator role' })
  @UseGuards(GqlAuthGuard)
  async updateCollaboratorRole(
    @Args('input') input: UpdateCollaboratorRoleInput,
    @CurrentUser() user: User,
  ): Promise<TripCollaborator> {
    return this.tripService.updateCollaboratorRole(input, user.id);
  }

  @Query(() => CollaboratorsListResponse, { description: 'Get all collaborators for a trip' })
  @UseGuards(GqlAuthGuard)
  async tripCollaborators(@Args('tripId', { type: () => ID }) tripId: string): Promise<CollaboratorsListResponse> {
    const collaborators = await this.tripService.getTripCollaborators(tripId);
    return {
      collaborators,
      total: collaborators.length,
    };
  }

  @Query(() => [CollaboratorResponse], { description: 'Get pending invitations for a trip' })
  @UseGuards(GqlAuthGuard)
  async tripPendingInvitations(
    @Args('tripId', { type: () => ID }) tripId: string,
    @CurrentUser() user: User,
  ): Promise<TripCollaborator[]> {
    return this.tripService.getTripPendingInvitations(tripId, user.id);
  }

  @Query(() => [CollaboratorResponse], { description: 'Get all collaboration invitations for authenticated user' })
  @UseGuards(GqlAuthGuard)
  async myInvitations(@CurrentUser() user: User): Promise<TripCollaborator[]> {
    return this.tripService.getUserInvitations(user.id);
  }

  @Query(() => [TripResponse], { description: 'Get all trips shared with authenticated user' })
  @UseGuards(GqlAuthGuard)
  async sharedTrips(@CurrentUser() user: User): Promise<Trip[]> {
    return this.tripService.getSharedTripsForUser(user.id);
  }
}
