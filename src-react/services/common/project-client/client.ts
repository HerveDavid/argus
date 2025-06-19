import { invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';

import { Project } from '@/types/project';

import { ProjectError } from './error';

interface ProjectService {
  readonly loadProject: () => Effect.Effect<Project, ProjectError>;
}

export class ProjectClient extends Effect.Service<ProjectClient>()(
  '@/common/ProjectClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        loadProject: (): Effect.Effect<Project, ProjectError> =>
          Effect.tryPromise({
            try: () => invoke<Project>('load_project'),
            catch: (error) =>
              new ProjectError({
                message:
                  error instanceof Error ? error.message : 'Unknown error',
              }),
          }),
      } satisfies ProjectService;
    }),
  },
) {}
