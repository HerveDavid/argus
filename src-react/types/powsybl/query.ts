import { Schema } from 'effect';

const QueryParameter = Schema.Union(
  Schema.NonEmptyString,
  Schema.Number,
  Schema.Boolean,
  Schema.Null,
  Schema.Array(Schema.NonEmptyString),
  Schema.Array(Schema.Number),
  Schema.Array(
    Schema.Union(Schema.String, Schema.Number, Schema.Boolean, Schema.Null),
  ),
);

export const QuerySchema = Schema.Struct({
  query: Schema.NonEmptyString,
  parameters: Schema.optional(Schema.Array(QueryParameter)),
});

export type Query = Schema.Schema.Type<typeof QuerySchema>;
