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
        let place;

        // Ưu tiên sử dụng placeId nếu có
        if (data.placeId) {
            place = await this.placeService.findOneBy({ id: data.placeId });
            if (!place) {
                throw new Error('Place not found');
            }
        } 
        // Nếu có googlePlaceId → tìm trong DB trước, nếu chưa có thì gọi Google API và tạo mới
        else if (data.googlePlaceId) {
            place = await this.placeService.findOrCreateFromGooglePlaceId(data.googlePlaceId);
        } else {
            throw new Error('Vui lòng cung cấp placeId hoặc googlePlaceId');
        }

        return this.checkinService.createCheckin(user, place, data.status, data.mood);
    }

    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    async myCheckins(@CurrentUser() user: User) {
        return this.checkinService.getUserCheckins(user.id);
    }
}

