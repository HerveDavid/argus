import { invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';

import { CreateProjectParams, Project, QueryResponse } from '@/types/project';

import { ProjectError } from './error';
import { SldDiagram } from '@/types/sld-diagram';

interface ProjectService {
  readonly loadProject: () => Effect.Effect<Project, ProjectError>;
  readonly initDatabaseProject: (
    dbPath?: string,
  ) => Effect.Effect<string, ProjectError>;
  readonly queryProject: (
    query: string,
  ) => Effect.Effect<QueryResponse, ProjectError>;
  readonly createNewProject: (
    params: CreateProjectParams,
  ) => Effect.Effect<Project, ProjectError>;
  readonly getSingleLineDiagram: (
    element_id: string,
  ) => Effect.Effect<SldDiagram, ProjectError>;
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

        initDatabaseProject: (
          dbPath?: string,
        ): Effect.Effect<string, ProjectError> =>
          Effect.tryPromise({
            try: () =>
              invoke<string>('init_database_project', { db_path: dbPath }),
            catch: (error) =>
              new ProjectError({
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to initialize database',
              }),
          }),

        queryProject: (
          query: string,
        ): Effect.Effect<QueryResponse, ProjectError> =>
          Effect.tryPromise({
            try: () => invoke<QueryResponse>('query_project', { query }),
            catch: (error) =>
              new ProjectError({
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to execute query',
              }),
          }),

        createNewProject: (
          params: CreateProjectParams,
        ): Effect.Effect<Project, ProjectError> =>
          Effect.tryPromise({
            try: () =>
              invoke<Project>('create_new_project', {
                name: params.name,
                path: params.path,
                config_path: params.configPath,
              }),
            catch: (error) =>
              new ProjectError({
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to create project',
              }),
          }),

        getSingleLineDiagram: (
          element_id: string,
        ): Effect.Effect<SldDiagram, ProjectError> =>
          Effect.tryPromise({
            try: () =>
              invoke<SldDiagram>('get_single_line_diagram', {
                line_id: element_id,
              }),
            catch: (error) =>
              new ProjectError({
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to get single line diagram',
              }),
          }),
      } satisfies ProjectService;
    }),
  },
) {}
