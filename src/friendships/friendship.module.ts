import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Friendship } from "./friendship.entity";
import { FriendshipResolver } from "./friendship.resolver";
import { FriendshipService } from "./friendship.service";
import './friendship-status.graphql';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship])],
  providers: [FriendshipService, FriendshipResolver],
  exports: [FriendshipService],
})
export class FriendshipModule {}
