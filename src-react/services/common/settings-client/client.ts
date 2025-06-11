import { invoke } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';

import {
  SettingNotFoundError,
  SettingUpdateError,
  SettingDeleteError,
} from './errors';
import { SettingsService } from './types';

export class SettingsClient extends Effect.Service<SettingsClient>()(
  '@/common/SettingsClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        // Get a setting by key
        getSetting: <T>(key: string) =>
          Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
              try: () => invoke<T | null>('get_setting', { key }),
              catch: (error) =>
                new SettingNotFoundError({ key, cause: String(error) }),
            });

            if (result === null) {
              return yield* Effect.fail(new SettingNotFoundError({ key }));
            }

            return result;
          }),

        // Set a setting
        setSetting: <T>(key: string, value: T) =>
          Effect.gen(function* () {
            yield* Effect.tryPromise({
              try: () => invoke('set_setting', { key, value }),
              catch: (error) =>
                new SettingUpdateError({ key, cause: String(error) }),
            });
          }),

        // Get setting with default value
        getSettingWithDefault: <T>(key: string, defaultValue: T) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: () =>
                invoke<T>('get_setting_with_default', {
                  key,
                  default_value: defaultValue,
                }),
              catch: (error) =>
                new SettingNotFoundError({ key, cause: String(error) }),
            });
          }),

        // Merge settings (for objects)
        mergeSettings: (key: string, newValue: unknown) =>
          Effect.gen(function* () {
            yield* Effect.tryPromise({
              try: () => invoke('merge_settings', { key, newValue }),
              catch: (error) =>
                new SettingUpdateError({ key, cause: String(error) }),
            });
          }),

        // Set nested setting
        setNestedSetting: (key: string, path: string, value: unknown) =>
          Effect.gen(function* () {
            yield* Effect.tryPromise({
              try: () => invoke('set_nested_setting', { key, path, value }),
              catch: (error) =>
                new SettingUpdateError({ key, cause: String(error) }),
            });
          }),

        // Get nested setting
        getNestedSetting: <T>(key: string, path: string) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: () => invoke<T>('get_nested_setting', { key, path }),
              catch: (error) =>
                new SettingNotFoundError({ key, cause: String(error) }),
            });
          }),

        // Delete a setting
        deleteSetting: (key: string) =>
          Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
              try: () => invoke<boolean>('delete_setting', { key }),
              catch: (error) =>
                new SettingDeleteError({ key, cause: String(error) }),
            });

            if (!result) {
              return yield* Effect.fail(new SettingNotFoundError({ key }));
            }

            return result;
          }),

        // List all settings
        listAllSettings: () =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: () => invoke<Record<string, unknown>>('list_all_settings'),
              catch: (error) =>
                new SettingNotFoundError({ key: '*', cause: String(error) }),
            });
          }),

        // Check if setting exists
        settingExists: (key: string) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: () => invoke<boolean>('setting_exists', { key }),
              catch: (error) =>
                new SettingNotFoundError({ key, cause: String(error) }),
            });
          }),

        // Clear all settings
        clearAllSettings: () =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: () => invoke<number>('clear_all_settings'),
              catch: (error) =>
                new SettingDeleteError({ key: '*', cause: String(error) }),
            });
          }),

        // Count settings
        countSettings: () =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: () => invoke<number>('count_settings'),
              catch: (error) =>
                new SettingNotFoundError({ key: '*', cause: String(error) }),
            });
          }),

        // Typed setters and getters
        setStringSetting: (key: string, value: string) =>
          Effect.gen(function* () {
            yield* Effect.tryPromise({
              try: () => invoke('set_string_setting', { key, value }),
              catch: (error) =>
                new SettingUpdateError({ key, cause: String(error) }),
            });
          }),

        getStringSetting: (key: string) =>
          Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
              try: () => invoke<string | null>('get_string_setting', { key }),
              catch: (error) =>
                new SettingNotFoundError({ key, cause: String(error) }),
            });

            if (result === null) {
              return yield* Effect.fail(new SettingNotFoundError({ key }));
            }

            return result;
          }),

        setBoolSetting: (key: string, value: boolean) =>
          Effect.gen(function* () {
            yield* Effect.tryPromise({
              try: () => invoke('set_bool_setting', { key, value }),
              catch: (error) =>
                new SettingUpdateError({ key, cause: String(error) }),
            });
          }),

        getBoolSetting: (key: string) =>
          Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
              try: () => invoke<boolean | null>('get_bool_setting', { key }),
              catch: (error) =>
                new SettingNotFoundError({ key, cause: String(error) }),
            });

            if (result === null) {
              return yield* Effect.fail(new SettingNotFoundError({ key }));
            }

            return result;
          }),

        setNumberSetting: (key: string, value: number) =>
          Effect.gen(function* () {
            yield* Effect.tryPromise({
              try: () => invoke('set_number_setting', { key, value }),
              catch: (error) =>
                new SettingUpdateError({ key, cause: String(error) }),
            });
          }),

        getNumberSetting: (key: string) =>
          Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
              try: () => invoke<number | null>('get_number_setting', { key }),
              catch: (error) =>
                new SettingNotFoundError({ key, cause: String(error) }),
            });

            if (result === null) {
              return yield* Effect.fail(new SettingNotFoundError({ key }));
            }

            return result;
          }),
      } as SettingsService;
    }),
  },
) {}
