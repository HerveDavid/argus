import { invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';

import { SessionError } from './error';
import { RootConfig } from '@/types/session.ts';


interface SessionService {
    readonly setConfigSession: (
        name: string,
        path: string,
    ) => Effect.Effect<RootConfig, SessionError>;
}

export class SessionClient extends Effect.Service<SessionClient>()(
    '@/common/SessionClient',
    {
        dependencies: [],
        effect: Effect.gen(function* () {
            return {
                setConfigSession: (
                    name: string,
                    path: string,
                ): Effect.Effect<RootConfig, SessionError> =>
                    Effect.tryPromise({
                        try: () => {
                            return invoke<RootConfig>('set_session_config', { name, path })
                        },
                        catch: (error) => {
                            console.log(error)
                            return new SessionError({
                                message: error.message
                            })
                        }
                    })
            } satisfies SessionService
        }),
    },
) {}