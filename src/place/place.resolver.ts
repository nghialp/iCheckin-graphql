import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Place } from './place.entity';
import { PlaceService } from './place.service';
import { CreatePlaceInput, SearchPlace } from './dto/place.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';

@Resolver(() => Place)
export class PlaceResolver {
  constructor(private readonly placeService: PlaceService) { }

  @Mutation(() => Place)
  // @UseGuards(GqlAuthGuard)
  async createPlace(@Args('input') input: CreatePlaceInput): Promise<Place> {
    return this.placeService.createPlace(input);
  }

  @Query(() => [Place])
  // @UseGuards(GqlAuthGuard)
  async nearestPlaces(
    @Args('lat') lat: number,
    @Args('lng') lng: number,
  ): Promise<Place[]> {
    return this.placeService.getNearestPlaces(lat, lng);
  }

  @Query(() => [SearchPlace])
  // @UseGuards(GqlAuthGuard)
  async searchPlaces(
    @Args('keyword') keyword: string,
    @Args('lat') lat: number,
    @Args('lng') lng: number,
  ): Promise<SearchPlace[]> {
    return this.placeService.searchPlacesByKeyword(keyword, lat, lng);
  }

  @Query(() => [SearchPlace])
  // @UseGuards(GqlAuthGuard)
  async nearbyPlaces(
    @Args('lat', { type: () => Number }) lat: number,
    @Args('lng', { type: () => Number }) lng: number,
    @Args('radius', { type: () => Number, nullable: true }) radius?: number,
  ): Promise<SearchPlace[]> {
    return this.placeService.getNearbyPlaces(lat, lng, radius ?? 500);
  }
}