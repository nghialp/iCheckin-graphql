import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

@Resolver(() => User)
export class UserResolver {
  constructor(private usersService: UserService) {}

  @Query(() => [User])
  getUsers() {
    return this.usersService.getAll();
  }

  @Query(() => User)
  getUser(@Args('id') id: string) {
    return this.usersService.findById(id);
  }
}
