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

export const loadGameMasterOutputs = () =>
  Effect.gen(function* () {
    return yield* Effect.tryPromise({
      try: () => invoke<{ status: string }>('load_game_master_outputs_in_db'),
      catch: (error) => console.error(error),
    });
  });

export const setIidmConfig = (iidm_path: string) =>
  Effect.gen(function* () {
    return yield* Effect.tryPromise({
      try: () => invoke<{ status: string }>('load_iidm_file', { iidm_path }),
      catch: (error) => console.error(error),
    });
  });

export const loadIidm = () =>
  Effect.gen(function* () {
    return yield* Effect.tryPromise({
      try: () => invoke<{ status: string }>('upload_iidm'),
      catch: (error) => console.error(error),
    });
  });
