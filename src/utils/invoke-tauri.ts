import { invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';

interface ErrorWithCause extends Error {
  cause?: unknown;
}

/**
 * Effect wrapper for invoking Tauri commands with generic error handling
 */
export const invokeTauri = <T, E extends ErrorWithCause = ErrorWithCause>(
  command: string,
  args?: Record<string, unknown>,
  createError: (message: string, cause?: unknown) => E = (message, cause) => {
    const error = new Error(message) as E;
    if (cause !== undefined) {
      error.cause = cause;
    }
    return error;
  },
) =>
  Effect.tryPromise({
    try: () => invoke<T>(command, args),
    catch: (error) =>
      createError(
        `Failed to invoke Tauri command '${command}': ${error}`,
        error,
      ),
  });