import { Resolver, Query, Args, Mutation, Float } from '@nestjs/graphql';
import { Checkin } from './checkin.entity';
import { CheckinService } from './checkin.service';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { CreateCheckinInput } from './dto/checkin.input';
import { PlaceService } from 'src/place/place.service';
import { Int } from '@nestjs/graphql';


@Resolver(() => Checkin)
export class CheckinResolver {
    constructor(
        private checkinService: CheckinService,
        private placeService: PlaceService,
    ) { }

    @Mutation(() => Checkin)
    @UseGuards(GqlAuthGuard)
    async checkin(@Args('data') data: CreateCheckinInput, @CurrentUser() user: User) {
        let place;

        // Prioritize using placeId if available
        if (data.placeId) {
            place = await this.placeService.findOneBy({ id: data.placeId });
            if (!place) {
                throw new NotFoundException('Place not found');
            }
        } 
        // If mapboxId is provided, search in DB first, otherwise call Mapbox API
        else if (data.mapboxId) {
            place = await this.placeService.findOrCreateFromMapboxId(data.mapboxId);
        } else {
            throw new BadRequestException('Please provide placeId or mapboxId');
        }

        return this.checkinService.createCheckin(user, place, data.status, data.mood);
    }

    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    async myCheckins(@CurrentUser() user: User) {
        return this.checkinService.getUserCheckins(user.id);
    }

    /**
     * Get current user's checkins near a specific location
     */
    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    async myCheckinsByNearLocation(
        @Args('lat', { type: () => Float }) lat: number,
        @Args('lng', { type: () => Float }) lng: number,
        @Args('radiusKm', { type: () => Float, nullable: true }) radiusKm?: number,
        @Args('page', { type: () => Int, nullable: true }) page?: number,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
        @CurrentUser() user?: User,
    ) {
        if (!user) throw new Error('User not authenticated');
        return this.checkinService.getCheckinsByNearByLocation(lat, lng, radiusKm, user.id, page, limit);
    }

    /**
     * Get all checkins near a specific location (public)
     */
    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    async allCheckinsByNearByLocation(
        @Args('lat', { type: () => Float }) lat: number,
        @Args('lng', { type: () => Float }) lng: number,
        @Args('radiusKm', { type: () => Float, nullable: true }) radiusKm?: number,
        @Args('page', { type: () => Int, nullable: true }) page?: number,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.checkinService.getCheckinsByNearByLocation(lat, lng, radiusKm, undefined, page, limit);
    }

    /**
     * Get all friends' checkins
     */
    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    async myFriendsCheckins(
        @Args('page', { type: () => Int, nullable: true }) page?: number,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
        @CurrentUser() user?: User,
    ) {
        if (!user) throw new Error('User not authenticated');
        return this.checkinService.getFriendsCheckins(user.id, page, limit);
    }

    /**
     * Get friends' checkins near a specific location
     */
    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    async myFriendCheckinsByLocation(
        @Args('lat', { type: () => Float }) lat: number,
        @Args('lng', { type: () => Float }) lng: number,
        @Args('radiusKm', { type: () => Float, nullable: true }) radiusKm?: number,
        @Args('page', { type: () => Int, nullable: true }) page?: number,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
        @CurrentUser() user?: User,
    ) {
        if (!user) throw new Error('User not authenticated');
        return this.checkinService.getFriendsCheckinsByLocation(user.id, lat, lng, radiusKm, page, limit);
    }

    /**
     * Get all checkins for a specific place by mapboxId (all people who checked in)
     */
    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    async placeCheckins(
        @Args('mapboxId', { type: () => String }) mapboxId: string,
        @Args('page', { type: () => Int, nullable: true }) page?: number,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.checkinService.getPlaceCheckinsByMapboxId(mapboxId, page, limit);
    }

    /**
     * Get friends' checkins for a place by mapboxId
     */
    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    async placeCheckinsByFriends(
        @Args('mapboxId', { type: () => String }) mapboxId: string,
        @Args('page', { type: () => Int, nullable: true }) page?: number,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
        @CurrentUser() user?: User,
    ) {
        if (!user) throw new Error('User not authenticated');
        return this.checkinService.getFriendsCheckinsByMapboxId(user.id, mapboxId, page, limit);
    }

    /**
     * Get current user's checkin for a place by mapboxId
     */
    @Query(() => Checkin, { nullable: true })
    @UseGuards(GqlAuthGuard)
    async myCheckinForPlace(
        @Args('mapboxId', { type: () => String }) mapboxId: string,
        @CurrentUser() user?: User,
    ): Promise<Checkin | null> {
        if (!user) throw new Error('User not authenticated');
        return this.checkinService.getUserCheckinByMapboxId(user.id, mapboxId);
    }

    /**
     * Check if current user has checked in at a place by mapboxId
     */
    @Query(() => Boolean)
    @UseGuards(GqlAuthGuard)
    async hasCheckedIn(
        @Args('mapboxId', { type: () => String }) mapboxId: string,
        @CurrentUser() user?: User,
    ): Promise<boolean> {
        if (!user) throw new Error('User not authenticated');
        return this.checkinService.hasUserCheckedInByMapboxId(user.id, mapboxId);
    }
}

