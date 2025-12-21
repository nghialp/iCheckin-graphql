import { registerEnumType } from '@nestjs/graphql';
import { FriendshipStatus } from './friendship-status.enum';

registerEnumType(FriendshipStatus, {
  name: 'FriendshipStatus',
  description: 'Trạng thái quan hệ bạn bè',
})