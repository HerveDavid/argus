import { invoke } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';

import { SessionError, createSessionError } from './errors';
import { RootConfig } from '@/types/session';

export interface SessionService {
  readonly setSessionConfig: (
    name: string,
    path: string,
  ) => Effect.Effect<RootConfig, SessionError>;
  readonly setSessionConfigWithFile: (
    name: string,
    path: string | null,
    filePath: string,
    baseDirectory: string | null,
  ) => Effect.Effect<RootConfig, SessionError>;
  readonly getSessionStatus: () => Effect.Effect<RootConfig, SessionError>;
}

export class SessionClient extends Effect.Service<SessionClient>()(
  '@/common/SessionClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        // Set session config with name and path
        setSessionConfig: (name: string, path: string) =>
          Effect.tryPromise({
            try: () => invoke<RootConfig>('set_session_config', { name, path }),
            catch: (error) => createSessionError(String(error)),
          }),

        // Set session config with file upload
        setSessionConfigWithFile: (
          name: string,
          path: string | null,
          filePath: string,
          baseDirectory: string | null,
        ) =>
          Effect.tryPromise({
            try: () =>
              invoke<RootConfig>('set_session_config_with_file', {
                name,
                path,
                file_path: filePath,
                base_directory: baseDirectory,
              }),
            catch: (error) => createSessionError(String(error)),
          }),

        // Get current session status
        getSessionStatus: () =>
          Effect.tryPromise({
            try: () => invoke<RootConfig>('get_session_status'),
            catch: (error) => createSessionError(String(error)),
          }),
      } satisfies SessionService;
    }),
  },
) {}
