import { Schema } from 'effect';

export interface Event {
  id: string;
  value: number;
  timestamp: string;
}

export const FeederEventSchema = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('Scada'),
    graphicalId: Schema.String,
    value: Schema.Number,
  }),
  Schema.Struct({
    type: Schema.Literal('GameMaster'),
    graphicalId: Schema.String,
    value: Schema.Number,
  }),
  Schema.Struct({
    type: Schema.Literal('Error'),
    graphicalId: Schema.String,
    message: Schema.String,
  }),
);

export type FeederEvent = Schema.Schema.Type<typeof FeederEventSchema>;
