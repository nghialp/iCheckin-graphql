import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { Checkin } from './checin.entity';
import { CheckinService } from './checkin.service';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';


@Resolver(() => Checkin)
export class CheckinResolver {
    constructor(private checkinService: CheckinService) {}

    @Mutation(() => Checkin)
    @UseGuards(GqlAuthGuard)
    checkin(@Args('location') location: string, @Args('note', { nullable: true }) note: string, @CurrentUser() user: User) {
    return this.checkinService.createCheckin(user.id, location, note);
    }

    @Query(() => [Checkin])
    @UseGuards(GqlAuthGuard)
    myCheckins(@CurrentUser() user: User) {
    return this.checkinService.getUserCheckins(user.id);
    }

    @Query(() => [Checkin])
    checkinsAt(@Args('location') location: string) {
    return this.checkinService.getCheckinsByLocation(location);
    }

}