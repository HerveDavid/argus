import { Effect, pipe } from 'effect';
import React from 'react';

import { SessionClient } from '@/services/common/session-client';
import { useRuntime } from '@/services/runtime/use-runtime';

export const StartupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const runtime = useRuntime();
  const startedRef = React.useRef(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const startupProgram = Effect.gen(function* () {
      yield* Effect.logInfo('Starting application...');
      yield* Effect.sleep('1 second');

      const sessionClient = yield* SessionClient;
      const rootConfig = yield* sessionClient.setConfigSession(
        'aa',
        '/home/hervedav/Projects/TwinEU-core/docs/orchestrator/examples/scenario_MQIS_NB/config_mapped.toml',
      );

      yield* Effect.logInfo('Application startup completed successfully');

      return { rootConfig };
    });

    const program = pipe(
      startupProgram,
      Effect.catchAll((error) =>
        Effect.gen(function* () {
          yield* Effect.logError(
            `Startup failed: ${error.message || String(error)}`,
          );
          return Effect.fail(error);
        }),
      ),
    );

    runtime
      .runPromise(program)
      .then((result) => {
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message || 'Application startup failed');
        setIsLoading(false);
      });
  }, [runtime]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">
            Loading project and checking database...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Startup Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
