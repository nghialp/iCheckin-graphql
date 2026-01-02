import { Field, ID, InputType } from "@nestjs/graphql";
import { ObjectType, Float } from "@nestjs/graphql";

@ObjectType()
export class SearchPlace {
	@Field({ nullable: true })
	googlePlaceId?: string;

	@Field()
	name: string;

	@Field({ nullable: true })
	rating?: number;

	@Field({ nullable: true })
	address?: string;

	@Field(() => [String], { nullable: true })
  types?: string[];

	@Field(() => Float)
	lat: number;

	@Field(() => Float)
	lng: number;

	@Field(() => String, { nullable: true })
	thumbnail?: string;
}

@InputType()
export class CreatePlaceInput {
	@Field()
	name: string;

	@Field({ nullable: true })
	address?: string;

	@Field(() => [String], { nullable: true })
  types?: string[];

	@Field(() => Float)
	lat: number;

	@Field(() => Float)
	lng: number;

	@Field({ nullable: true })
	thumbnail?: string;

	@Field({ nullable: true })
	googlePlaceId?: string;
}