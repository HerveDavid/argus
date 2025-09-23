import { invoke } from '@tauri-apps/api/core';
import { Context, Data, Duration, Effect, Layer, pipe, Schedule } from 'effect';

export class TauriInvokeError extends Data.TaggedError('TauriInvokeError')<{
  readonly command: string;
  readonly originalError: unknown;
  readonly attempt?: number;
}> {}

export class TauriTimeoutError extends Data.TaggedError('TauriTimeoutError')<{
  readonly command: string;
  readonly timeoutMs: number;
}> {}

export interface TauriInvokeConfig {
  readonly timeout: number;
  readonly retryPolicy: {
    readonly maxAttempts: number;
    readonly backoffMs: number;
    readonly exponentialBackoff: boolean;
  };
}

export const TauriInvokeConfig = Context.GenericTag<TauriInvokeConfig>(
  '@/common/TauriInvokeConfig',
);

export const DefaultTauriConfig = Layer.succeed(TauriInvokeConfig, {
  timeout: 10000,
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    exponentialBackoff: true,
  },
});

export interface TauriService {
  /**
   * Invoke a Tauri command with timeout, retry, and error handling
   * Returns a raw Effect that can be piped with additional operations (logging, etc.)
   */
  readonly invoke: <T>(
    command: string,
    params?: Record<string, unknown>,
  ) => Effect.Effect<T, TauriInvokeError | TauriTimeoutError>;

  /**
   * Get current configuration
   */
  readonly getConfig: Effect.Effect<TauriInvokeConfig>;
}

export const TauriService = Context.GenericTag<TauriService>(
  '@/common/TauriService',
);

export const TauriServiceLive = Layer.effect(
  TauriService,
  Effect.gen(function* () {
    const config = yield* TauriInvokeConfig;

    const createRetrySchedule = () => {
      const baseSchedule = Schedule.exponential(
        Duration.millis(config.retryPolicy.backoffMs),
      );

      const boundedSchedule = Schedule.compose(
        baseSchedule,
        Schedule.recurs(config.retryPolicy.maxAttempts - 1),
      );

      return config.retryPolicy.exponentialBackoff
        ? boundedSchedule
        : Schedule.compose(
            Schedule.fixed(Duration.millis(config.retryPolicy.backoffMs)),
            Schedule.recurs(config.retryPolicy.maxAttempts - 1),
          );
    };

    const invokeWithTimeout = <T>(
      command: string,
      params?: Record<string, unknown>,
    ): Effect.Effect<T, TauriInvokeError | TauriTimeoutError> =>
      pipe(
        Effect.tryPromise({
          try: () => invoke<T>(command, params),
          catch: (err) => new TauriInvokeError({ command, originalError: err }),
        }),
        Effect.timeout(Duration.millis(config.timeout)),
        Effect.catchTag('TimeoutException', () =>
          Effect.fail(
            new TauriTimeoutError({ command, timeoutMs: config.timeout }),
          ),
        ),
      );

    const invokeWithRetry = <T>(
      command: string,
      params?: Record<string, unknown>,
    ): Effect.Effect<T, TauriInvokeError | TauriTimeoutError> =>
      pipe(
        invokeWithTimeout<T>(command, params),
        Effect.retry({
          schedule: createRetrySchedule(),
          while: (error) => error._tag === 'TauriInvokeError',
        }),
      );

    return TauriService.of({
      invoke: invokeWithRetry,
      getConfig: Effect.succeed(config),
    });
  }),
);

// export const TauriServiceDefault = TauriServiceLive.pipe(
//   Layer.provide(DefaultTauriConfig),
// );

// export const TauriServiceLayer = TauriServiceLive;

// export const makeTauriConfig = (
//   config: Partial<TauriInvokeConfig>,
// ): Layer.Layer<TauriInvokeConfig> =>
//   Layer.succeed(TauriInvokeConfig, {
//     timeout: 10000,
//     retryPolicy: {
//       maxAttempts: 3,
//       backoffMs: 1000,
//       exponentialBackoff: true,
//     },
//     ...config,
//   });

// export const withTauriLogging = <T, E>(
//   effect: Effect.Effect<T, E>,
//   command: string,
//   params?: Record<string, unknown>,
// ) =>
//   pipe(
//     effect,
//     Effect.tap((result) =>
//       Effect.log(`✅ Tauri command '${command}' succeeded`, { params, result }),
//     ),
//     Effect.tapError((error) =>
//       Effect.logError(`❌ Tauri command '${command}' failed`, {
//         params,
//         error,
//       }),
//     ),
//   );

// export const withTauriTiming = <T, E>(
//   effect: Effect.Effect<T, E>,
//   command: string,
// ) =>
//   pipe(
//     effect,
//     Effect.timed,
//     Effect.tap(([duration]) =>
//       Effect.log(
//         `⏱️  Tauri command '${command}' took ${Duration.toMillis(duration)}ms`,
//       ),
//     ),
//     Effect.map(([, result]) => result),
//   );
