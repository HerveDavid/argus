import { invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';

interface ProjectService {
  readonly loadProject: () => Effect.Effect<unknown, undefined>;
}

export class ProjectClient extends Effect.Service<ProjectClient>()(
  '@/features/ProjectClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        loadProject: () => {
          Effect.gen(function* () {
            yield* Effect.tryPromise({
              try: () => invoke('load_settings'),
              catch: (error) => null as unknown,
            });
          });
        },
      } as ProjectService;
    }),
  },
) {}
