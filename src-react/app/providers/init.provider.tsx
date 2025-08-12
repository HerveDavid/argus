import { rxRuntime } from '@/config/runtime';
import { SettingsClient } from '@/services/common/settings-client';
import { SessionClient } from '@/services/session';
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

  return Result.match(initResult, {
    onFailure: (e) => (
      <div style={{ color: 'red', padding: '20px' }}>
        <h3>Erreur d'initialisation</h3>
        <pre>{JSON.stringify(e, null, 2)}</pre>
      </div>
    ),
    onSuccess: (result) => {
      console.log('Initialisation terminée:', result);
      return <>{children}</>;
    },
    onInitial: () => (
      <div style={{ padding: '20px' }}>
        <div>Initialisation en cours...</div>
      </div>
    ),
  });
};
