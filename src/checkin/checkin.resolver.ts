import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { Checkin } from './checin.entity';
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
        const place = await this.placeService.findOneBy({ id: data.placeId });
        if (!place) {
            throw new Error('Place not found');
        }
        return this.checkinService.createCheckin(user, place, data.status, data.mood);
    }

    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    async myCheckins(@CurrentUser() user: User) {
        return this.checkinService.getUserCheckins(user.id);
    }
}