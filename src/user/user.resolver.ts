import { Resolver, Query, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';

@Resolver(() => User)
export class UserResolver {
  constructor(private usersService: UserService) {}

  @Query(() => [User])
  @UseGuards(GqlAuthGuard)
  getUsers() {
    return this.usersService.getAll();
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  getUser(@Args('id') id: string) {
    return this.usersService.findById(id);
  }
}
