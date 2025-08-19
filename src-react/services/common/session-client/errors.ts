export abstract class SessionError extends Error {
  abstract readonly _tag: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class RequestFailedError extends SessionError {
  readonly _tag = 'RequestFailed';

  constructor(public readonly cause: string) {
    super(`HTTP request failed: ${cause}`);
  }
}

export class HttpError extends SessionError {
  readonly _tag = 'HttpError';

  constructor(
    public readonly status: number,
    public readonly message: string,
  ) {
    super(`HTTP error ${status}: ${message}`);
  }
}

export class JsonSerializationError extends SessionError {
  readonly _tag = 'JsonSerialization';

  constructor(public readonly cause: string) {
    super(`JSON serialization failed: ${cause}`);
  }
}

export class JsonDeserializationError extends SessionError {
  readonly _tag = 'JsonDeserialization';

  constructor(public readonly cause: string) {
    super(`JSON deserialization failed: ${cause}`);
  }
}

export class InvalidUrlError extends SessionError {
  readonly _tag = 'InvalidUrl';

  constructor(public readonly url: string) {
    super(`Invalid URL: ${url}`);
  }
}

export class TimeoutError extends SessionError {
  readonly _tag = 'Timeout';

  constructor() {
    super('Network timeout');
  }
}

export class AuthenticationFailedError extends SessionError {
  readonly _tag = 'AuthenticationFailed';

  constructor() {
    super('Authentication failed');
  }
}

export class AuthorizationFailedError extends SessionError {
  readonly _tag = 'AuthorizationFailed';

  constructor() {
    super('Authorization failed: insufficient permissions');
  }
}

export class NotFoundError extends SessionError {
  readonly _tag = 'NotFound';

  constructor(public readonly resource: string) {
    super(`Resource not found: ${resource}`);
  }
}

export class ServerError extends SessionError {
  readonly _tag = 'ServerError';

  constructor(public readonly message: string) {
    super(`Server error: ${message}`);
  }
}

export class ClientError extends SessionError {
  readonly _tag = 'ClientError';

  constructor(public readonly message: string) {
    super(`Client error: ${message}`);
  }
}

export class ConnectionFailedError extends SessionError {
  readonly _tag = 'ConnectionFailed';

  constructor(public readonly cause: string) {
    super(`Connection failed: ${cause}`);
  }
}

export class InvalidResponseFormatError extends SessionError {
  readonly _tag = 'InvalidResponseFormat';

  constructor() {
    super('Invalid response format');
  }
}

export class RateLimitExceededError extends SessionError {
  readonly _tag = 'RateLimitExceeded';

  constructor() {
    super('Rate limit exceeded');
  }
}

export class ServiceUnavailableError extends SessionError {
  readonly _tag = 'ServiceUnavailable';

  constructor() {
    super('Service unavailable');
  }
}

// Helper function to create appropriate error from string
export function createSessionError(errorString: string): SessionError {
  // Try to parse the error string and create appropriate error type
  if (errorString.includes('HTTP request failed')) {
    const cause = errorString.replace('HTTP request failed: ', '');
    return new RequestFailedError(cause);
  }

  if (errorString.includes('HTTP error')) {
    const match = errorString.match(/HTTP error (\d+): (.+)/);
    if (match) {
      return new HttpError(parseInt(match[1]), match[2]);
    }
  }

  if (errorString.includes('JSON serialization failed')) {
    const cause = errorString.replace('JSON serialization failed: ', '');
    return new JsonSerializationError(cause);
  }

  if (errorString.includes('JSON deserialization failed')) {
    const cause = errorString.replace('JSON deserialization failed: ', '');
    return new JsonDeserializationError(cause);
  }

  if (errorString.includes('Invalid URL')) {
    const url = errorString.replace('Invalid URL: ', '');
    return new InvalidUrlError(url);
  }

  if (errorString.includes('Network timeout')) {
    return new TimeoutError();
  }

  if (errorString.includes('Authentication failed')) {
    return new AuthenticationFailedError();
  }

  if (errorString.includes('Authorization failed')) {
    return new AuthorizationFailedError();
  }

  if (errorString.includes('Resource not found')) {
    const resource = errorString.replace('Resource not found: ', '');
    return new NotFoundError(resource);
  }

  if (errorString.includes('Server error')) {
    const message = errorString.replace('Server error: ', '');
    return new ServerError(message);
  }

  if (errorString.includes('Client error')) {
    const message = errorString.replace('Client error: ', '');
    return new ClientError(message);
  }

  if (errorString.includes('Connection failed')) {
    const cause = errorString.replace('Connection failed: ', '');
    return new ConnectionFailedError(cause);
  }

  if (errorString.includes('Invalid response format')) {
    return new InvalidResponseFormatError();
  }

  if (errorString.includes('Rate limit exceeded')) {
    return new RateLimitExceededError();
  }

  if (errorString.includes('Service unavailable')) {
    return new ServiceUnavailableError();
  }

  // Default to ClientError if no specific match found
  return new ClientError(errorString);
}
