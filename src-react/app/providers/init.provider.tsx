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

const waitForApiEffect = (maxRetries: number = 10) =>
  Effect.gen(function* () {
    const sessionClient = yield* SessionClient;

    for (let i = 0; i < maxRetries; i++) {
      try {
        yield* sessionClient
          .getSessionStatus()
          .pipe(Effect.catchAll(() => Effect.succeed(null)));
        return true;
      } catch {
        if (i < maxRetries - 1) {
          yield* Effect.sleep(1000);
        }
      }
    }
    return false;
  });

const initProjectRx = rxRuntime.rx(
  Effect.fn(function* () {
    const settingsClient = yield* SettingsClient;
    const sessionClient = yield* SessionClient;

    yield* Effect.logInfo('Starting application...');
    yield* Effect.sleep('2 seconds');

    const apiReady = yield* waitForApiEffect();

    if (!apiReady) {
      return {
        hasSession: false,
        apiNotReady: true,
      };
    }

    const initResult = yield* Effect.gen(function* () {
      const currentProject = yield* settingsClient
        .getSetting<{
          name: string;
          path: string;
          configPath: string;
          lastAccessed: string;
        }>('current-project')
        .pipe(Effect.catchAll(() => Effect.succeed(null)));

      const currentSession = yield* settingsClient
        .getSetting<CurrentSession>('session-current')
        .pipe(Effect.catchAll(() => Effect.succeed(null)));

      if (!currentProject && !currentSession) {
        return {
          hasSession: false,
          apiNotReady: false,
        };
      }

      let sessionName: string;
      let sessionPath: string;
      let configFilePath: string | undefined;

      if (currentProject && currentProject.configPath) {
        sessionName = currentProject.name;
        sessionPath = currentProject.path;
        configFilePath = currentProject.configPath;
      } else if (currentSession) {
        sessionName = currentSession.name;
        sessionPath = currentSession.path;
        configFilePath = `${currentSession.path}/${currentSession.name}.toml`;
      } else {
        return {
          hasSession: false,
          apiNotReady: false,
        };
      }

      yield* sessionClient
        .setSessionConfig(sessionName, configFilePath)
        .pipe(Effect.catchAll(() => Effect.succeed(null)));

      return {
        hasSession: true,
        sessionName,
        sessionPath,
        configFilePath,
        apiNotReady: false,
      };
    });

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
          <p className="mb-4">{JSON.stringify(e, null, 2)}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
            <button
              onClick={() => {
                window.location.hash = '#skip-session';
                window.location.reload();
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Continue without session
            </button>
          </div>
        </div>
      </div>
    ),
    onSuccess: (result) => {
      if ('apiNotReady' in result && result.apiNotReady) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center text-yellow-600">
              <h2 className="text-xl font-bold mb-2">API Not Ready</h2>
              <p className="mb-4">
                The backend API is not responding. Please ensure it's running.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
                <button
                  onClick={() => {
                    return children;
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Continue anyway
                </button>
              </div>
            </div>
          </div>
        );
      }

      return <>{children}</>;
    },
    onWaiting: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading argus...</p>
          <p className="mt-2 text-sm text-gray-600">
            Waiting something
          </p>
        </div>
      </div>
    ),
    onDefect: () => <div></div>,
  });
};
