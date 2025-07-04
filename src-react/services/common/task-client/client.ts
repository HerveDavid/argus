import { invoke } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import {
  TaskActionResponse,
  TaskInfo,
  TasksListResponse,
  TasksStatistics,
  TaskStatus,
} from './types';
import { TaskOperationError } from './errors';

export interface TaskService {
  readonly startTask: (
    taskId: string,
  ) => Effect.Effect<TaskActionResponse, TaskOperationError>;
  readonly closeTask: (
    taskId: string,
  ) => Effect.Effect<TaskActionResponse, TaskOperationError>;
  readonly pauseTask: (
    taskId: string,
  ) => Effect.Effect<TaskActionResponse, TaskOperationError>;
  readonly resumeTask: (
    taskId: string,
  ) => Effect.Effect<TaskActionResponse, TaskOperationError>;
  readonly getTaskStatus: (
    taskId: string,
  ) => Effect.Effect<TaskStatus, TaskOperationError>;
  readonly listActiveTasks: () => Effect.Effect<
    TasksListResponse,
    TaskOperationError
  >;
  readonly getTaskCount: () => Effect.Effect<number, TaskOperationError>;
  readonly getTasksStatistics: () => Effect.Effect<
    TasksStatistics,
    TaskOperationError
  >;
  readonly isTaskRunning: (taskId: string) => Effect.Effect<boolean>;
  readonly isTaskPaused: (taskId: string) => Effect.Effect<boolean>;
  readonly ensureTaskRunning: (taskId: string) => Effect.Effect<boolean>;
  readonly ensureTaskPaused: (taskId: string) => Effect.Effect<boolean>;
  readonly getTaskInfo: (taskId: string) => Effect.Effect<TaskInfo>;
}

export class TaskClient extends Effect.Service<TaskClient>()(
  '@/tasks/TaskClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      // Cache local pour optimiser les appels répétés
      const taskStatusCacheRef = yield* Ref.make<
        Map<string, { status: TaskStatus; timestamp: number }>
      >(new Map());

      const CACHE_TTL = 5000; // 5 secondes de cache

      const getCachedStatus = (taskId: string) =>
        Effect.gen(function* () {
          const cache = yield* Ref.get(taskStatusCacheRef);
          const cached = cache.get(taskId);

          if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.status;
          }

          return null;
        });

      const setCachedStatus = (taskId: string, status: TaskStatus) =>
        Effect.gen(function* () {
          const cache = yield* Ref.get(taskStatusCacheRef);
          const newCache = new Map(cache);
          newCache.set(taskId, { status, timestamp: Date.now() });
          yield* Ref.set(taskStatusCacheRef, newCache);
        });

      const clearCachedStatus = (taskId: string) =>
        Effect.gen(function* () {
          const cache = yield* Ref.get(taskStatusCacheRef);
          const newCache = new Map(cache);
          newCache.delete(taskId);
          yield* Ref.set(taskStatusCacheRef, newCache);
        });

      return {
        startTask: (taskId: string) =>
          Effect.gen(function* () {
            yield* Effect.logDebug(`Starting task ${taskId}`);

            const response = yield* Effect.tryPromise({
              try: () =>
                invoke<TaskActionResponse>('start_task', { id: taskId }),
              catch: (error) => new TaskOperationError('Start', taskId, error),
            });

            if (response.task_status) {
              yield* setCachedStatus(taskId, response.task_status);
            }

            yield* Effect.logInfo(
              `Task ${taskId} started: ${response.message}`,
            );
            return response;
          }),

        closeTask: (taskId: string) =>
          Effect.gen(function* () {
            yield* Effect.logDebug(`Closing task ${taskId}`);

            const response = yield* Effect.tryPromise({
              try: () =>
                invoke<TaskActionResponse>('close_task', { id: taskId }),
              catch: (error) => new TaskOperationError('Close', taskId, error),
            });

            yield* clearCachedStatus(taskId);

            yield* Effect.logInfo(`Task ${taskId} closed: ${response.message}`);
            return response;
          }),

        pauseTask: (taskId: string) =>
          Effect.gen(function* () {
            yield* Effect.logDebug(`Pausing task ${taskId}`);

            const response = yield* Effect.tryPromise({
              try: () =>
                invoke<TaskActionResponse>('pause_task', { id: taskId }),
              catch: (error) => new TaskOperationError('Pause', taskId, error),
            });

            if (response.task_status) {
              yield* setCachedStatus(taskId, response.task_status);
            }

            yield* Effect.logInfo(`Task ${taskId} paused: ${response.message}`);
            return response;
          }),

        resumeTask: (taskId: string) =>
          Effect.gen(function* () {
            yield* Effect.logDebug(`Resuming task ${taskId}`);

            const response = yield* Effect.tryPromise({
              try: () =>
                invoke<TaskActionResponse>('resume_task', { id: taskId }),
              catch: (error) => new TaskOperationError('Resume', taskId, error),
            });

            if (response.task_status) {
              yield* setCachedStatus(taskId, response.task_status);
            }

            yield* Effect.logInfo(
              `Task ${taskId} resumed: ${response.message}`,
            );
            return response;
          }),

        getTaskStatus: (taskId: string) =>
          Effect.gen(function* () {
            // Vérifier le cache d'abord
            const cached = yield* getCachedStatus(taskId);
            if (cached) {
              yield* Effect.logDebug(`Using cached status for task ${taskId}`);
              return cached;
            }

            yield* Effect.logDebug(`Getting status for task ${taskId}`);

            const status = yield* Effect.tryPromise({
              try: () => invoke<TaskStatus>('get_task_status', { id: taskId }),
              catch: (error) =>
                new TaskOperationError('GetStatus', taskId, error),
            });

            yield* setCachedStatus(taskId, status);
            return status;
          }),

        listActiveTasks: () =>
          Effect.gen(function* () {
            yield* Effect.logDebug('Listing active tasks');

            return yield* Effect.tryPromise({
              try: () => invoke<TasksListResponse>('list_active_tasks'),
              catch: (error) =>
                new TaskOperationError('ListTasks', 'all', error),
            });
          }),

        getTaskCount: () =>
          Effect.gen(function* () {
            yield* Effect.logDebug('Getting task count');

            return yield* Effect.tryPromise({
              try: () => invoke<number>('get_task_count'),
              catch: (error) =>
                new TaskOperationError('GetCount', 'all', error),
            });
          }),

        getTasksStatistics: () =>
          Effect.gen(function* () {
            yield* Effect.logDebug('Getting tasks statistics');

            return yield* Effect.tryPromise({
              try: () => invoke<TasksStatistics>('get_tasks_statistics'),
              catch: (error) =>
                new TaskOperationError('GetStatistics', 'all', error),
            });
          }),

        // Méthodes de convenance
        isTaskRunning: (taskId: string) =>
          Effect.gen(function* () {
            const status = yield* Effect.tryPromise({
              try: () => invoke<TaskStatus>('get_task_status', { id: taskId }),
              catch: (error) =>
                new TaskOperationError('CheckRunning', taskId, error),
            });

            return status.exists && status.paused === false;
          }),

        isTaskPaused: (taskId: string) =>
          Effect.gen(function* () {
            const status = yield* Effect.tryPromise({
              try: () => invoke<TaskStatus>('get_task_status', { id: taskId }),
              catch: (error) =>
                new TaskOperationError('CheckPaused', taskId, error),
            });

            return status.exists && status.paused === true;
          }),

        ensureTaskRunning: (taskId: string) =>
          Effect.gen(function* () {
            const status = yield* Effect.tryPromise({
              try: () => invoke<TaskStatus>('get_task_status', { id: taskId }),
              catch: (error) =>
                new TaskOperationError('EnsureRunning', taskId, error),
            });

            if (!status.exists) {
              yield* Effect.logWarning(`Task ${taskId} does not exist`);
              return false;
            }

            if (status.paused === true) {
              yield* Effect.logDebug(`Task ${taskId} is paused, resuming...`);
              yield* Effect.tryPromise({
                try: () =>
                  invoke<TaskActionResponse>('resume_task', { id: taskId }),
                catch: (error) =>
                  new TaskOperationError('Resume', taskId, error),
              });
              return true;
            }

            if (status.paused === false) {
              yield* Effect.logDebug(`Task ${taskId} is already running`);
              return true;
            }

            return false;
          }),

        ensureTaskPaused: (taskId: string) =>
          Effect.gen(function* () {
            const status = yield* Effect.tryPromise({
              try: () => invoke<TaskStatus>('get_task_status', { id: taskId }),
              catch: (error) =>
                new TaskOperationError('EnsurePaused', taskId, error),
            });

            if (!status.exists) {
              yield* Effect.logWarning(`Task ${taskId} does not exist`);
              return false;
            }

            if (status.paused === false) {
              yield* Effect.logDebug(`Task ${taskId} is running, pausing...`);
              yield* Effect.tryPromise({
                try: () =>
                  invoke<TaskActionResponse>('pause_task', { id: taskId }),
                catch: (error) =>
                  new TaskOperationError('Pause', taskId, error),
              });
              return true;
            }

            if (status.paused === true) {
              yield* Effect.logDebug(`Task ${taskId} is already paused`);
              return true;
            }

            return false;
          }),

        getTaskInfo: (taskId: string) =>
          Effect.gen(function* () {
            const status = yield* Effect.tryPromise({
              try: () => invoke<TaskStatus>('get_task_status', { id: taskId }),
              catch: (error) =>
                new TaskOperationError('GetInfo', taskId, error),
            });

            return {
              taskId,
              status,
              isRunning: status.exists && status.paused === false,
              isPaused: status.exists && status.paused === true,
              exists: status.exists,
            } as TaskInfo;
          }),
      } as TaskService;
    }),
  },
) {}
