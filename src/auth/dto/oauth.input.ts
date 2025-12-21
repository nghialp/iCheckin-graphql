import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class OAuthInput {
  @Field() provider: string; // 'google' hoặc 'facebook'
  @Field() providerId: string;
  @Field() email: string;
  @Field() name: string;
  @Field({ nullable: true }) avatar?: string;
}