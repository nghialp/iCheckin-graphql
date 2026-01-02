import { Field, ID, InputType } from "@nestjs/graphql";
import { MediaInput } from "src/media/dto/media.input";
import { Media } from "src/media/media.entity";

@InputType()
export class CreatePostInput {
    @Field(() => ID)
    placeId: string;

    @Field({ nullable: true })
    content: string;

    @Field(() => [String], { nullable: true })
    images?: string[];

    @Field(() => [String], { nullable: true })
    tags?: string[];

    @Field({ nullable: true })
    cost?: number;

    @Field({ nullable: true })
    rating?: number;

    @Field(() => [MediaInput], { nullable: true })
    media?: MediaInput[];
}

@InputType()
export class UpdatePostInput {
    @Field(() => ID)
    placeId: string;

    @Field({ nullable: true })
    content: string;

    @Field(() => [String], { nullable: true })
    images?: string[];

    @Field(() => [String], { nullable: true })
    tags?: string[];

    @Field({ nullable: true })
    cost?: number;

    @Field({ nullable: true })
    rating?: number;

    @Field(() => [Media], { nullable: true })
    media?: Media[];
}