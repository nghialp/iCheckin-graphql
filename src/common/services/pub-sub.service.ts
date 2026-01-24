import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

export const PUB_SUB = 'PUB_SUB';

@Injectable()
export class PubSubService extends PubSub {}

