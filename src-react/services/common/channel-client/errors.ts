export class ChannelNotFoundError extends Error {
  readonly _tag = 'ChannelNotFoundError';
  constructor(channelId: string) {
    super(`Channel '${channelId}' not found`);
  }
}

export class HandlerNotFoundError extends Error {
  readonly _tag = 'HandlerNotFoundError';
  constructor(handlerId: string, channelId: string) {
    super(`Handler '${handlerId}' not found in channel '${channelId}'`);
  }
}

export class HandlerAlreadyExistsError extends Error {
  readonly _tag = 'HandlerAlreadyExistsError';
  constructor(handlerId: string, channelId: string) {
    super(`Handler '${handlerId}' already exists for channel '${channelId}'`);
  }
}

export class RegistrationError extends Error {
  readonly _tag = 'RegistrationError';
  constructor(channelId: string, cause: unknown) {
    super(`Registration failed for channel ${channelId}: ${cause}`);
  }
}

export class CleanupError extends Error {
  readonly _tag = 'CleanupError';
  constructor(channelId: string, cause: unknown) {
    super(`Cleanup failed for channel ${channelId}: ${cause}`);
  }
}
