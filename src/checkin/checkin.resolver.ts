import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Checkin } from './checkin.entity';
import { CheckinService } from './checkin.service';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { CreateCheckinInput } from './dto/checkin.input';
import { PlaceService } from 'src/place/place.service';


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
                throw new Error('Place not found');
            }
        } 
        // If mapboxId is provided, search in DB first, otherwise call Mapbox API
        else if (data.mapboxId) {
            place = await this.placeService.findOrCreateFromMapboxId(data.mapboxId);
        } else {
            throw new Error('Please provide placeId or mapboxId');
        }

        return this.checkinService.createCheckin(user, place, data.status, data.mood);
    }

    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    async myCheckins(@CurrentUser() user: User) {
        return this.checkinService.getUserCheckins(user.id);
    }
}

