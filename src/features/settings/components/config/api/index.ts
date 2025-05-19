import { invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';

export const setConfig = (config_path: string) =>
  Effect.gen(function* () {
    return yield* Effect.tryPromise({
      try: () =>
        invoke<{ status: string }>('load_config_file', {
          config_path,
        }),
      catch: (error) => console.error(error),
    });
  });
