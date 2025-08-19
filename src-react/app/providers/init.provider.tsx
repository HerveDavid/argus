import { rxRuntime } from '@/config/runtime';
import { SettingsClient } from '@/services/common/settings-client';
import { SessionClient } from '@/services/common/session-client';
import { useRxValue, Result } from '@effect-rx/rx-react';
import { Effect } from 'effect';
import React from 'react';

interface CurrentSession {
  name: string;
  path: string;
}

const initProjectRx = rxRuntime.rx(
  Effect.fn(function* () {
    const settingsClient = yield* SettingsClient;
    const sessionClient = yield* SessionClient;

    yield* Effect.logInfo('Starting application...');

    const initResult = yield* Effect.gen(function* () {
      const currentSession =
        yield* settingsClient.getSetting<CurrentSession>('current-session');

      yield* sessionClient.setSessionConfig(
        currentSession.name,
        currentSession.path,
      );

      return {
        hasSession: true,
        sessionName: currentSession.name,
        sessionPath: currentSession.path,
      };
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed({
          hasSession: false,
        }),
      ),
    );

    return initResult;
  }),
);

export const InitProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initResult = useRxValue(initProjectRx);

  return Result.matchWithWaiting(initResult, {
    onError: (e) => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Startup Error</h2>
          <p>{JSON.stringify(e, null, 2)}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    ),
    onSuccess: () => {
      return <>{children}</>;
    },
    onWaiting: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading argus...</p>
        </div>
      </div>
    ),
    onDefect: () => <div></div>,
  });
};
