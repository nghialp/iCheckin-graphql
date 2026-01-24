import { registerEnumType } from '@nestjs/graphql';

export enum Mood {
  HAPPY = 'HAPPY',
  SAD = 'SAD',
  NEUTRAL = 'NEUTRAL',
  EXCITED = 'EXCITED',
  TIRED = 'TIRED',
  ENERGETIC = 'ENERGETIC',
  GRATEFUL = 'GRATEFUL',
  PEACEFUL = 'PEACEFUL',
  LOVELY = 'LOVELY',
  AMAZING = 'AMAZING',
}

registerEnumType(Mood, {
  name: 'Mood',
  description: 'Mood states for check-ins',
});

