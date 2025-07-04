import * as Data from 'effect/Data';

export class NatsConnectionError extends Data.TaggedError(
  'NatsConnectionError',
)<{
  readonly address?: string;
  readonly cause: string;
}> {
  get message() {
    return `Failed to connect to NATS${this.address ? ` at ${this.address}` : ''}: ${this.cause}`;
  }
}

export class NatsDisconnectionError extends Data.TaggedError(
  'NatsDisconnectionError',
)<{
  readonly cause: string;
}> {
  get message() {
    return `Failed to disconnect from NATS: ${this.cause}`;
  }
}

export class NatsAddressError extends Data.TaggedError('NatsAddressError')<{
  readonly address: string;
  readonly cause: string;
}> {
  get message() {
    return `Failed to set NATS address '${this.address}': ${this.cause}`;
  }
}

export class NatsStatusError extends Data.TaggedError('NatsStatusError')<{
  readonly cause: string;
}> {
  get message() {
    return `Failed to get NATS status: ${this.cause}`;
  }
}

export type NatsError =
  | NatsConnectionError
  | NatsDisconnectionError
  | NatsAddressError
  | NatsStatusError;