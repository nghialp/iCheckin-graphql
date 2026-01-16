import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

// User Rewards Summary
@ObjectType()
export class UserRewardsSummary {
	@Field(() => Int)
	currentPoints: number;

	@Field()
	tier: string; // BRONZE, SILVER, GOLD, PLATINUM

	@Field(() => Int)
	nextTierPoints: number;

	@Field(() => Int)
	totalRedeemed: number;

	@Field(() => [RewardItem])
	rewards: RewardItem[];
}

// Reward Item
@ObjectType()
export class RewardItem {
	@Field(() => ID)
	id: string;

	@Field()
	title: string;

	@Field()
	description: string;

	@Field({ nullable: true })
	image?: string;

	@Field(() => Int)
	pointsRequired: number;

	@Field()
	category: string;

	@Field({ nullable: true })
	partner?: string;

	@Field(() => Boolean)
	inStock: boolean;

	@Field(() => Int, { nullable: true })
	likes?: number;

	@Field(() => Int, { nullable: true })
	redeemed?: number;

	@Field(() => Boolean)
	isLimited: boolean;

	@Field({ nullable: true })
	expiresAt?: string;

	@Field({ nullable: true })
	tier?: string;
}

// Reward Detail Response
@ObjectType()
export class RewardDetailResponse {
	@Field(() => ID)
	id: string;

	@Field()
	title: string;

	@Field()
	description: string;

	@Field({ nullable: true })
	image?: string;

	@Field(() => Int)
	pointsRequired: number;

	@Field()
	category: string;

	@Field({ nullable: true })
	partner?: string;

	@Field(() => Boolean)
	inStock: boolean;

	@Field(() => Int, { nullable: true })
	likes?: number;

	@Field(() => Int, { nullable: true })
	redeemed?: number;

	@Field(() => Boolean)
	isLimited: boolean;

	@Field({ nullable: true })
	expiresAt?: string;

	@Field({ nullable: true })
	tier?: string;

	@Field({ nullable: true })
	qrCode?: string;

	@Field({ nullable: true })
	redeemCode?: string;

	@Field({ nullable: true })
	partnerContact?: string;

	@Field({ nullable: true })
	validUntil?: string;
}

// Redeem History Item
@ObjectType()
export class RedeemHistoryItem {
	@Field(() => ID)
	id: string;

	@Field(() => RewardItem)
	reward: RewardItem;

	@Field()
	redeemedAt: string;

	@Field()
	status: string; // 'unused', 'used', 'expired'

	@Field({ nullable: true })
	qrCode?: string;

	@Field({ nullable: true })
	expiresAt?: string;

	@Field({ nullable: true })
	usedAt?: string;
}

// Redeem History Response
@ObjectType()
export class RedeemHistoryResponse {
	@Field(() => [RedeemHistoryItem])
	items: RedeemHistoryItem[];

	@Field(() => Int)
	total: number;

	@Field(() => Int)
	limit: number;

	@Field(() => Int)
	offset: number;
}

export class RewardDetailDto {
	@Field(() => String)
	id: string;

	@Field(() => String)
	title: string;

	@Field(() => String, { nullable: true })
	description?: string;

	@Field(() => String, { nullable: true })
	image?: string;

	@Field(() => Int)
	pointsRequired: number;

	@Field(() => String, { nullable: true })
	category?: string;

	@Field(() => String, { nullable: true })
	partner?: string;

	@Field(() => Boolean)
	inStock: boolean;

	@Field(() => Int)
	likes: number;

	@Field(() => Int)
	redeemed: number;

	@Field(() => Boolean)
	isLimited: boolean;

	@Field(() => Date, { nullable: true })
	expiresAt?: Date;

	@Field(() => String, { nullable: true })
	qrCode?: string;

	@Field(() => String, { nullable: true })
	redeemCode?: string;

	@Field(() => String, { nullable: true })
	partnerContact?: string;

	@Field(() => Date, { nullable: true })
	validUntil?: Date;
}

@ObjectType()
export class RedemptionEligibility {
	@Field(() => Boolean)
	eligible: boolean;

	@Field(() => String, { nullable: true })
	reason?: string;

	@Field(() => Int, { nullable: true })
	pointsNeeded?: number;
}

@ObjectType()
export class UserRewardsDto {
	@Field(() => Int)
	currentPoints: number;

	@Field(() => String)
	tier: string;

	@Field(() => Int)
	nextTierPoints: number;

	@Field(() => Int)
	totalRedeemed: number;

	@Field(() => [RewardItemDto])
	rewards: RewardItemDto[];
}

@ObjectType()
export class RewardStats {
	@Field(() => Int)
	total: number;

	@Field(() => Int)
	available: number;

	@Field(() => Int)
	outOfStock: number;

	@Field(() => Int)
	expired: number;
}

@ObjectType()
export class RewardItemDto {
	@Field(() => String)
	id: string;

	@Field(() => String)
	title: string;

	@Field(() => String, { nullable: true })
	description?: string;

	@Field(() => String, { nullable: true })
	image?: string;

	@Field(() => Int)
	pointsRequired: number;

	@Field(() => String, { nullable: true })
	category?: string;

	@Field(() => String, { nullable: true })
	partner?: string;

	@Field(() => Boolean)
	inStock: boolean;

	@Field(() => Int)
	likes: number;

	@Field(() => Int)
	redeemed: number;

	@Field(() => Boolean)
	isLimited: boolean;

	@Field(() => Date, { nullable: true })
	expiresAt?: Date;

	@Field(() => String)
	tier: string;

	@Field(() => String)
	qrCode: string;

	@Field(() => String)
	redeemCode: string;

	@Field(() => String, { nullable: true })
	partnerContact?: string;

	@Field(() => Date, { nullable: true })
	validUntil?: Date;
}

@ObjectType()
export class RedeemHistoryItemDto {
	@Field(() => String)
	id: string;

	@Field(() => String)
	rewardTitle: string;

	@Field(() => String, { nullable: true })
	rewardDescription?: string;

	@Field(() => String, { nullable: true })
	image?: string;

	@Field(() => Date)
	redeemedAt: Date;

	@Field(() => Int)
	pointsSpent: number;

	@Field(() => Boolean)
	isValid: boolean;
}

@ObjectType()
export class RedeemHistoryDto {
	@Field(() => [RedeemHistoryItemDto])
	items: RedeemHistoryItemDto[];

	@Field(() => Int)
	total: number;

	@Field(() => Int)
	limit: number;

	@Field(() => Int)
	offset: number;
}
