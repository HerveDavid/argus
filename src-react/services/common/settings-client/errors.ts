import * as Data from 'effect/Data';

export class SettingNotFoundError extends Data.TaggedError(
  'SettingNotFoundError',
)<{
  readonly key: string;
  readonly cause?: string;
}> {
  get message() {
    return `Setting '${this.key}' not found${this.cause ? `: ${this.cause}` : ''}`;
  }
}

export class SettingAlreadyExistsError extends Data.TaggedError(
  'SettingAlreadyExistsError',
)<{
  readonly key: string;
}> {
  get message() {
    return `Setting '${this.key}' already exists`;
  }
}

export class SettingUpdateError extends Data.TaggedError('SettingUpdateError')<{
  readonly key: string;
  readonly cause: string;
}> {
  get message() {
    return `Failed to update setting '${this.key}': ${this.cause}`;
  }
}

export class SettingDeleteError extends Data.TaggedError('SettingDeleteError')<{
  readonly key: string;
  readonly cause: string;
}> {
  get message() {
    return `Failed to delete setting '${this.key}': ${this.cause}`;
  }
}

export class SettingsInitializationError extends Data.TaggedError(
  'SettingsInitializationError',
)<{
  readonly cause: string;
}> {
  get message() {
    return `Failed to initialize settings: ${this.cause}`;
  }
}

export class SettingValidationError extends Data.TaggedError(
  'SettingValidationError',
)<{
  readonly key: string;
  readonly cause: string;
}> {
  get message() {
    return `Failed to validate setting '${this.key}': ${this.cause}`;
  }
}
