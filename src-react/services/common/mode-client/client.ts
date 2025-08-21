import { Effect } from 'effect';
import { invoke } from '@tauri-apps/api/core';

import { ModeError, TauriInvokeError } from './errors';
import { ModeCommand, ModeType } from './types';

interface ModeService {
  readonly switchMode: (mode: ModeType) => Effect.Effect<ModeType, ModeError>;
  readonly getCurrentMode: () => Effect.Effect<ModeType, ModeError>;
}

export class ModeClient extends Effect.Service<ModeClient>()(
  '@/common/mode/ModeClient',
  {
    effect: Effect.gen(function* () {
      const invokeTauri = <T>(
        command: string,
        args?: Record<string, any>,
      ): Effect.Effect<T, TauriInvokeError> => {
        return Effect.tryPromise({
          try: () => invoke<T>(command, args),
          catch: (error) =>
            new TauriInvokeError(
              error instanceof Error ? error.message : String(error),
            ),
        });
      };

      return {
        switchMode: function (
          mode: ModeType,
        ): Effect.Effect<ModeType, ModeError> {
          return Effect.gen(function* () {
            const modeCommand: ModeCommand = {
              type: mode, // Plus besoin de validation
            };

            yield* invokeTauri('switch_mode', { mode: modeCommand });

            return mode; // Retourner le ModeType directement
          });
        },

        getCurrentMode: function (): Effect.Effect<ModeType, ModeError> {
          return Effect.gen(function* () {
            const currentMode =
              yield* invokeTauri<ModeType>('get_current_mode');

            return currentMode;
          });
        },
      } satisfies ModeService;
    }),
  },
) {}
