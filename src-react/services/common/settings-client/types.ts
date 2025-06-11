import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';

import {
  SettingDeleteError,
  SettingNotFoundError,
  SettingUpdateError,
} from './errors';

export interface SettingsService {
  readonly getSetting: <T>(
    key: string,
  ) => Effect.Effect<T, SettingNotFoundError>;

  readonly setSetting: <T>(
    key: string,
    value: T,
  ) => Effect.Effect<void, SettingUpdateError>;

  readonly getSettingWithDefault: <T>(
    key: string,
    defaultValue: T,
  ) => Effect.Effect<T, SettingNotFoundError>;
  readonly mergeSettings: (
    key: string,
    newValue: unknown,
  ) => Effect.Effect<void, SettingUpdateError>;
  readonly setNestedSetting: (
    key: string,
    path: string,
    value: unknown,
  ) => Effect.Effect<void, SettingUpdateError>;
  readonly getNestedSetting: <T>(
    key: string,
    path: string,
  ) => Effect.Effect<T, SettingNotFoundError>;
  readonly deleteSetting: (
    key: string,
  ) => Effect.Effect<boolean, SettingDeleteError | SettingNotFoundError>;
  readonly listAllSettings: () => Effect.Effect<
    Record<string, unknown>,
    SettingNotFoundError
  >;
  readonly settingExists: (
    key: string,
  ) => Effect.Effect<boolean, SettingNotFoundError>;
  readonly clearAllSettings: () => Effect.Effect<number, SettingDeleteError>;
  readonly countSettings: () => Effect.Effect<number, SettingNotFoundError>;

  readonly setStringSetting: (
    key: string,
    value: string,
  ) => Effect.Effect<void, SettingUpdateError>;
  readonly getStringSetting: (
    key: string,
  ) => Effect.Effect<string, SettingNotFoundError>;
  readonly setBoolSetting: (
    key: string,
    value: boolean,
  ) => Effect.Effect<void, SettingUpdateError>;
  readonly getBoolSetting: (
    key: string,
  ) => Effect.Effect<boolean, SettingNotFoundError>;
  readonly setNumberSetting: (
    key: string,
    value: number,
  ) => Effect.Effect<void, SettingUpdateError>;
  readonly getNumberSetting: (
    key: string,
  ) => Effect.Effect<number, SettingNotFoundError>;
}

export const SettingValueSchema = S.Struct({
  _tag: S.Literal('SettingValue'),
  key: S.String,
  value: S.Unknown,
  createdAt: S.Date,
  updatedAt: S.Date,
});
export type SettingValue = S.Schema.Type<typeof SettingValueSchema>;

export const SettingsMapSchema = S.Struct({
  _tag: S.Literal('SettingsMap'),
  settings: S.Record({ key: S.String, value: SettingValueSchema }),
});
export type SettingsMap = S.Schema.Type<typeof SettingsMapSchema>;
