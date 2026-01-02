import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class MediaInput {
  @Field()
  url: string;

  @Field({ nullable: true })
  type?: string;
}