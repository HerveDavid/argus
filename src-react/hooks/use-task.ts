import * as Effect from 'effect/Effect';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import { useStoreRuntime } from '@/hooks/use-store-runtime';
import {
  TaskClient,
  TaskOperationError,
  TaskActionResponse,
  TaskInfo,
  TasksListResponse,
  TasksStatistics,
  TaskStatus,
} from '@/services/common/task-client';
import { LiveManagedRuntime } from '@/config/live-layer';

interface TaskStore {
  runtime: LiveManagedRuntime | null;

  // État des tâches
  tasks: Map<string, TaskInfo>;
  activeTasks: TasksListResponse | null;
  tasksStatistics: TasksStatistics | null;
  taskCount: number;

  // États de chargement
  isLoadingTasks: boolean;
  isLoadingStatistics: boolean;
  isLoadingTaskCount: boolean;

  // États d'actions spécifiques par tâche
  taskActions: Map<
    string,
    {
      isStarting: boolean;
      isClosing: boolean;
      isPausing: boolean;
      isResuming: boolean;
      isLoadingStatus: boolean;
    }
  >;

  // Erreurs
  error: TaskOperationError | null;
  taskErrors: Map<string, TaskOperationError>;

  // Cache et mise à jour automatique
  lastRefresh: number | null;
  autoRefreshInterval: NodeJS.Timeout | null;

  // Méthodes de base
  setRuntime: (runtime: LiveManagedRuntime) => void;

  // Actions sur les tâches
  startTask: (taskId: string) => Promise<TaskActionResponse>;
  closeTask: (taskId: string) => Promise<TaskActionResponse>;
  pauseTask: (taskId: string) => Promise<TaskActionResponse>;
  resumeTask: (taskId: string) => Promise<TaskActionResponse>;

  // Requêtes d'état
  getTaskStatus: (taskId: string) => Promise<TaskStatus>;
  getTaskInfo: (taskId: string) => Promise<TaskInfo>;
  refreshTask: (taskId: string) => Promise<void>;

  // Requêtes globales
  listActiveTasks: () => Promise<TasksListResponse>;
  getTaskCount: () => Promise<number>;
  getTasksStatistics: () => Promise<TasksStatistics>;
  refreshAll: () => Promise<void>;

  // Méthodes de convenance
  isTaskRunning: (taskId: string) => Promise<boolean>;
  isTaskPaused: (taskId: string) => Promise<boolean>;
  ensureTaskRunning: (taskId: string) => Promise<boolean>;
  ensureTaskPaused: (taskId: string) => Promise<boolean>;

  // Gestion des erreurs
  clearError: () => void;
  clearTaskError: (taskId: string) => void;
  clearAllErrors: () => void;

  // Contrôle du refresh automatique
  startAutoRefresh: (interval?: number) => void;
  stopAutoRefresh: () => void;

  // Méthodes utilitaires
  getTaskActionState: (taskId: string) => {
    isStarting: boolean;
    isClosing: boolean;
    isPausing: boolean;
    isResuming: boolean;
    isLoadingStatus: boolean;
  };

  // État dérivé
  runningTasks: TaskInfo[];
  pausedTasks: TaskInfo[];
  isAnyTaskLoading: boolean;
}

const DEFAULT_REFRESH_INTERVAL = 30000; // 30 secondes

const getDefaultTaskActionState = () => ({
  isStarting: false,
  isClosing: false,
  isPausing: false,
  isResuming: false,
  isLoadingStatus: false,
});

export const useTaskStore = () => useStoreRuntime<TaskStore>(useTaskStoreInner);

const useTaskStoreInner = create<TaskStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      runtime: null,

      // État initial
      tasks: new Map(),
      activeTasks: null,
      tasksStatistics: null,
      taskCount: 0,

      // États de chargement
      isLoadingTasks: false,
      isLoadingStatistics: false,
      isLoadingTaskCount: false,

      // États d'actions
      taskActions: new Map(),

      // Erreurs
      error: null,
      taskErrors: new Map(),

      // Cache
      lastRefresh: null,
      autoRefreshInterval: null,

      setRuntime: (runtime) => {
        set({ runtime });

        // Charger les données initiales
        const { refreshAll } = get();
        refreshAll();
      },

      startTask: async (taskId: string) => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        // Mettre à jour l'état de chargement
        const currentActions =
          get().taskActions.get(taskId) || getDefaultTaskActionState();
        set((state) => ({
          taskActions: new Map(state.taskActions).set(taskId, {
            ...currentActions,
            isStarting: true,
          }),
        }));

        try {
          const startTaskEffect = Effect.gen(function* () {
            const taskClient = yield* TaskClient;
            return yield* taskClient.startTask(taskId);
          });

          const result = await runtime.runPromise(startTaskEffect);

          // Mettre à jour l'état local et rafraîchir
          await get().refreshTask(taskId);

          return result;
        } catch (error) {
          const taskError = error as TaskOperationError;
          set((state) => ({
            taskErrors: new Map(state.taskErrors).set(taskId, taskError),
          }));
          throw error;
        } finally {
          // Réinitialiser l'état de chargement
          const currentActions =
            get().taskActions.get(taskId) || getDefaultTaskActionState();
          set((state) => ({
            taskActions: new Map(state.taskActions).set(taskId, {
              ...currentActions,
              isStarting: false,
            }),
          }));
        }
      },

      closeTask: async (taskId: string) => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        const currentActions =
          get().taskActions.get(taskId) || getDefaultTaskActionState();
        set((state) => ({
          taskActions: new Map(state.taskActions).set(taskId, {
            ...currentActions,
            isClosing: true,
          }),
        }));

        try {
          const closeTaskEffect = Effect.gen(function* () {
            const taskClient = yield* TaskClient;
            return yield* taskClient.closeTask(taskId);
          });

          const result = await runtime.runPromise(closeTaskEffect);

          // Supprimer la tâche du cache local
          set((state) => ({
            tasks: new Map(
              Array.from(state.tasks.entries()).filter(([id]) => id !== taskId),
            ),
          }));

          // Rafraîchir les données globales
          await get().refreshAll();

          return result;
        } catch (error) {
          const taskError = error as TaskOperationError;
          set((state) => ({
            taskErrors: new Map(state.taskErrors).set(taskId, taskError),
          }));
          throw error;
        } finally {
          const currentActions =
            get().taskActions.get(taskId) || getDefaultTaskActionState();
          set((state) => ({
            taskActions: new Map(state.taskActions).set(taskId, {
              ...currentActions,
              isClosing: false,
            }),
          }));
        }
      },

      pauseTask: async (taskId: string) => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        const currentActions =
          get().taskActions.get(taskId) || getDefaultTaskActionState();
        set((state) => ({
          taskActions: new Map(state.taskActions).set(taskId, {
            ...currentActions,
            isPausing: true,
          }),
        }));

        try {
          const pauseTaskEffect = Effect.gen(function* () {
            const taskClient = yield* TaskClient;
            return yield* taskClient.pauseTask(taskId);
          });

          const result = await runtime.runPromise(pauseTaskEffect);
          await get().refreshTask(taskId);

          return result;
        } catch (error) {
          const taskError = error as TaskOperationError;
          set((state) => ({
            taskErrors: new Map(state.taskErrors).set(taskId, taskError),
          }));
          throw error;
        } finally {
          const currentActions =
            get().taskActions.get(taskId) || getDefaultTaskActionState();
          set((state) => ({
            taskActions: new Map(state.taskActions).set(taskId, {
              ...currentActions,
              isPausing: false,
            }),
          }));
        }
      },

      resumeTask: async (taskId: string) => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        const currentActions =
          get().taskActions.get(taskId) || getDefaultTaskActionState();
        set((state) => ({
          taskActions: new Map(state.taskActions).set(taskId, {
            ...currentActions,
            isResuming: true,
          }),
        }));

        try {
          const resumeTaskEffect = Effect.gen(function* () {
            const taskClient = yield* TaskClient;
            return yield* taskClient.resumeTask(taskId);
          });

          const result = await runtime.runPromise(resumeTaskEffect);
          await get().refreshTask(taskId);

          return result;
        } catch (error) {
          const taskError = error as TaskOperationError;
          set((state) => ({
            taskErrors: new Map(state.taskErrors).set(taskId, taskError),
          }));
          throw error;
        } finally {
          const currentActions =
            get().taskActions.get(taskId) || getDefaultTaskActionState();
          set((state) => ({
            taskActions: new Map(state.taskActions).set(taskId, {
              ...currentActions,
              isResuming: false,
            }),
          }));
        }
      },

      getTaskStatus: async (taskId: string) => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        const currentActions =
          get().taskActions.get(taskId) || getDefaultTaskActionState();
        set((state) => ({
          taskActions: new Map(state.taskActions).set(taskId, {
            ...currentActions,
            isLoadingStatus: true,
          }),
        }));

        try {
          const getStatusEffect = Effect.gen(function* () {
            const taskClient = yield* TaskClient;
            return yield* taskClient.getTaskStatus(taskId);
          });

          const status = await runtime.runPromise(getStatusEffect);
          return status;
        } catch (error) {
          const taskError = error as TaskOperationError;
          set((state) => ({
            taskErrors: new Map(state.taskErrors).set(taskId, taskError),
          }));
          throw error;
        } finally {
          const currentActions =
            get().taskActions.get(taskId) || getDefaultTaskActionState();
          set((state) => ({
            taskActions: new Map(state.taskActions).set(taskId, {
              ...currentActions,
              isLoadingStatus: false,
            }),
          }));
        }
      },

      getTaskInfo: async (taskId: string) => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        try {
          const getInfoEffect = Effect.gen(function* () {
            const taskClient = yield* TaskClient;
            return yield* taskClient.getTaskInfo(taskId);
          });

          const info = await runtime.runPromise(getInfoEffect);

          // Mettre à jour le cache
          set((state) => ({
            tasks: new Map(state.tasks).set(taskId, info),
          }));

          return info;
        } catch (error) {
          const taskError = error as TaskOperationError;
          set((state) => ({
            taskErrors: new Map(state.taskErrors).set(taskId, taskError),
          }));
          throw error;
        }
      },

      refreshTask: async (taskId: string) => {
        await get().getTaskInfo(taskId);
      },

      listActiveTasks: async () => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        set({ isLoadingTasks: true, error: null });

        try {
          const listTasksEffect = Effect.gen(function* () {
            const taskClient = yield* TaskClient;
            return yield* taskClient.listActiveTasks();
          });

          const tasks = await runtime.runPromise(listTasksEffect);

          set({
            activeTasks: tasks,
            isLoadingTasks: false,
            lastRefresh: Date.now(),
          });

          return tasks;
        } catch (error) {
          set({
            isLoadingTasks: false,
            error: error as TaskOperationError,
          });
          throw error;
        }
      },

      getTaskCount: async () => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        set({ isLoadingTaskCount: true, error: null });

        try {
          const getCountEffect = Effect.gen(function* () {
            const taskClient = yield* TaskClient;
            return yield* taskClient.getTaskCount();
          });

          const count = await runtime.runPromise(getCountEffect);

          set({
            taskCount: count,
            isLoadingTaskCount: false,
          });

          return count;
        } catch (error) {
          set({
            isLoadingTaskCount: false,
            error: error as TaskOperationError,
          });
          throw error;
        }
      },

      getTasksStatistics: async () => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        set({ isLoadingStatistics: true, error: null });

        try {
          const getStatsEffect = Effect.gen(function* () {
            const taskClient = yield* TaskClient;
            return yield* taskClient.getTasksStatistics();
          });

          const stats = await runtime.runPromise(getStatsEffect);

          set({
            tasksStatistics: stats,
            isLoadingStatistics: false,
          });

          return stats;
        } catch (error) {
          set({
            isLoadingStatistics: false,
            error: error as TaskOperationError,
          });
          throw error;
        }
      },

      refreshAll: async () => {
        const { listActiveTasks, getTaskCount, getTasksStatistics } = get();

        try {
          await Promise.all([
            listActiveTasks(),
            getTaskCount(),
            getTasksStatistics(),
          ]);
        } catch (error) {
          console.error('Error refreshing all task data:', error);
        }
      },

      isTaskRunning: async (taskId: string) => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        const isRunningEffect = Effect.gen(function* () {
          const taskClient = yield* TaskClient;
          return yield* taskClient.isTaskRunning(taskId);
        });

        return await runtime.runPromise(isRunningEffect);
      },

      isTaskPaused: async (taskId: string) => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        const isPausedEffect = Effect.gen(function* () {
          const taskClient = yield* TaskClient;
          return yield* taskClient.isTaskPaused(taskId);
        });

        return await runtime.runPromise(isPausedEffect);
      },

      ensureTaskRunning: async (taskId: string) => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        const ensureRunningEffect = Effect.gen(function* () {
          const taskClient = yield* TaskClient;
          return yield* taskClient.ensureTaskRunning(taskId);
        });

        const result = await runtime.runPromise(ensureRunningEffect);

        // Rafraîchir la tâche après changement d'état
        await get().refreshTask(taskId);

        return result;
      },

      ensureTaskPaused: async (taskId: string) => {
        const { runtime } = get();
        if (!runtime) throw new Error('Runtime not available');

        const ensurePausedEffect = Effect.gen(function* () {
          const taskClient = yield* TaskClient;
          return yield* taskClient.ensureTaskPaused(taskId);
        });

        const result = await runtime.runPromise(ensurePausedEffect);

        // Rafraîchir la tâche après changement d'état
        await get().refreshTask(taskId);

        return result;
      },

      clearError: () => {
        set({ error: null });
      },

      clearTaskError: (taskId: string) => {
        set((state) => {
          const newErrors = new Map(state.taskErrors);
          newErrors.delete(taskId);
          return { taskErrors: newErrors };
        });
      },

      clearAllErrors: () => {
        set({ error: null, taskErrors: new Map() });
      },

      startAutoRefresh: (interval = DEFAULT_REFRESH_INTERVAL) => {
        const { stopAutoRefresh, refreshAll } = get();

        // Arrêter l'ancien intervalle s'il existe
        stopAutoRefresh();

        const intervalId = setInterval(() => {
          refreshAll();
        }, interval);

        set({ autoRefreshInterval: intervalId });
      },

      stopAutoRefresh: () => {
        const { autoRefreshInterval } = get();
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
          set({ autoRefreshInterval: null });
        }
      },

      getTaskActionState: (taskId: string) => {
        const { taskActions } = get();
        return taskActions.get(taskId) || getDefaultTaskActionState();
      },

      // États dérivés (calculés)
      get runningTasks() {
        const { tasks } = get();
        return Array.from(tasks.values()).filter((task) => task.isRunning);
      },

      get pausedTasks() {
        const { tasks } = get();
        return Array.from(tasks.values()).filter((task) => task.isPaused);
      },

      get isAnyTaskLoading() {
        const {
          isLoadingTasks,
          isLoadingStatistics,
          isLoadingTaskCount,
          taskActions,
        } = get();

        const hasTaskActionLoading = Array.from(taskActions.values()).some(
          (actions) =>
            actions.isStarting ||
            actions.isClosing ||
            actions.isPausing ||
            actions.isResuming ||
            actions.isLoadingStatus,
        );

        return (
          isLoadingTasks ||
          isLoadingStatistics ||
          isLoadingTaskCount ||
          hasTaskActionLoading
        );
      },
    })),
    { name: 'task-store' },
  ),
);

// Auto-refresh des données quand le runtime est disponible
useTaskStoreInner.subscribe(
  (state) => state.runtime,
  (runtime) => {
    if (runtime) {
      const { startAutoRefresh } = useTaskStoreInner.getState();
      startAutoRefresh();
    }
  },
  { fireImmediately: false },
);

// Nettoyage lors de la destruction
useTaskStoreInner.subscribe(
  (state) => state.runtime,
  (runtime) => {
    if (!runtime) {
      const { stopAutoRefresh } = useTaskStoreInner.getState();
      stopAutoRefresh();
    }
  },
  { fireImmediately: false },
);

// Log des erreurs
useTaskStoreInner.subscribe(
  (state) => state.error,
  (error) => {
    if (error) {
      console.error('Task Store Error:', error.message);
    }
  },
  { fireImmediately: false },
);

// Log des erreurs spécifiques aux tâches
useTaskStoreInner.subscribe(
  (state) => state.taskErrors,
  (taskErrors) => {
    taskErrors.forEach((error, taskId) => {
      console.error(`Task ${taskId} Error:`, error.message);
    });
  },
  { fireImmediately: false },
);
