import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Place } from './place.entity';
import { PlaceService } from './place.service';
import { CreatePlaceInput, SearchPlace } from './dto/place.input';

@Resolver(() => Place)
export class PlaceResolver {
  constructor(private readonly placeService: PlaceService) { }

  @Mutation(() => Place)
  async createPlace(@Args('input') input: CreatePlaceInput): Promise<Place> {
    return this.placeService.createPlace(input);
  }

  @Query(() => [Place])
  async nearestPlaces(
    @Args('lat') lat: number,
    @Args('lng') lng: number,
  ): Promise<Place[]> {
    return this.placeService.getNearestPlaces(lat, lng);
  }

  @Query(() => [SearchPlace])
  async searchPlaces(
    @Args('keyword') keyword: string,
    @Args('lat') lat: number,
    @Args('lng') lng: number,
  ): Promise<SearchPlace[]> {
    return this.placeService.searchPlacesByKeyword(keyword, lat, lng);
  }

  @Query(() => [SearchPlace])
  async nearbyPlaces(
    @Args('lat', { type: () => Number }) lat: number,
    @Args('lng', { type: () => Number }) lng: number,
    @Args('radius', { type: () => Number, nullable: true }) radius?: number,
  ): Promise<SearchPlace[]> {
    return this.placeService.getNearbyPlaces(lat, lng, radius ?? 500);
  }
}