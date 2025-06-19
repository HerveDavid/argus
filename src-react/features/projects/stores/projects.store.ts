import { invoke } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import { LiveManagedRuntime } from '@/config/live-layer';
import { useStoreRuntime } from '@/hooks/use-store-runtime';
import { ProjectClient } from '@/services/common/project-client';
import { SettingsClient } from '@/services/common/settings-client';
import { Project } from '@/types/project';

const KEY_CURRENT_PROJECT = 'current-project';
const KEY_RECENT_PROJECTS = 'recent-projects';

export interface ProjectsStore {
  currentProject: Project | null;
  recentProjects: Project[];
  runtime: LiveManagedRuntime | null;

  setCurrentProject: (project: Project | null) => void;
  updateCurrentProject: (
    updates: Partial<Omit<Project, 'lastAccessed'>>,
  ) => void;

  addRecentProject: (project: Omit<Project, 'lastAccessed'>) => void;
  removeRecentProject: (projectPath: string) => void;
  switchToProject: (project: Project) => void;
  clearRecentProjects: () => void;
  getRecentProjectsSorted: () => Project[];
  loadProject: () => Promise<Project | undefined>;

  setRuntime: (runtime: LiveManagedRuntime) => void;
}

const getStoredCurrentProject = (): Project | null => {
  try {
    const stored = localStorage.getItem(KEY_CURRENT_PROJECT);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      lastAccessed: new Date(parsed.lastAccessed),
    };
  } catch {
    return null;
  }
};

const getStoredRecentProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(KEY_RECENT_PROJECTS);
    if (!stored) return [];

    const projects = JSON.parse(stored);
    return projects.map((p: any) => ({
      ...p,
      lastAccessed: new Date(p.lastAccessed),
    }));
  } catch {
    return [];
  }
};

const initialCurrentProject = getStoredCurrentProject();
const initialRecentProjects = getStoredRecentProjects();

export const useProjectsStore = () =>
  useStoreRuntime<ProjectsStore>(useProjectsStoreInner);

const useProjectsStoreInner = create<ProjectsStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      currentProject: initialCurrentProject,
      recentProjects: initialRecentProjects,
      runtime: null,

      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project });

        if (project) {
          localStorage.setItem(
            KEY_CURRENT_PROJECT,
            JSON.stringify({
              ...project,
              lastAccessed: project.lastAccessed.toISOString(),
            }),
          );
        } else {
          localStorage.removeItem(KEY_CURRENT_PROJECT);
        }
      },

      updateCurrentProject: (
        updates: Partial<Omit<Project, 'lastAccessed'>>,
      ) => {
        const currentState = get();
        if (!currentState.currentProject) return;

        const updatedProject: Project = {
          ...currentState.currentProject,
          ...updates,
          lastAccessed: new Date(),
        };

        set({ currentProject: updatedProject });
        localStorage.setItem(
          KEY_CURRENT_PROJECT,
          JSON.stringify({
            ...updatedProject,
            lastAccessed: updatedProject.lastAccessed.toISOString(),
          }),
        );
      },

      addRecentProject: (project: Omit<Project, 'lastAccessed'>) => {
        const state = get();
        const existingIndex = state.recentProjects.findIndex(
          (p) => p.path === project.path,
        );

        const newProject: Project = {
          ...project,
          lastAccessed: new Date(),
        };

        let updatedProjects: Project[];

        if (existingIndex >= 0) {
          updatedProjects = [...state.recentProjects];
          updatedProjects[existingIndex] = newProject;
        } else {
          updatedProjects = [newProject, ...state.recentProjects];
          if (updatedProjects.length > 10) {
            updatedProjects = updatedProjects.slice(0, 10);
          }
        }

        set({ recentProjects: updatedProjects });

        localStorage.setItem(
          KEY_RECENT_PROJECTS,
          JSON.stringify(
            updatedProjects.map((p) => ({
              ...p,
              lastAccessed: p.lastAccessed.toISOString(),
            })),
          ),
        );
      },

      removeRecentProject: (projectPath: string) => {
        const state = get();
        const updatedProjects = state.recentProjects.filter(
          (p) => p.path !== projectPath,
        );
        set({ recentProjects: updatedProjects });

        localStorage.setItem(
          KEY_RECENT_PROJECTS,
          JSON.stringify(
            updatedProjects.map((p) => ({
              ...p,
              lastAccessed: p.lastAccessed.toISOString(),
            })),
          ),
        );
      },

      switchToProject: async (project: Project) => {
        const updatedProject: Project = {
          ...project,
          lastAccessed: new Date(),
        };

        set({ currentProject: updatedProject });

        get().addRecentProject({
          name: project.name,
          path: project.path,
          configPath: project.configPath,
        });

        // TODO: create a service
        await invoke('load_substations');
      },

      clearRecentProjects: () => {
        set({ recentProjects: [] });
        localStorage.removeItem(KEY_RECENT_PROJECTS);
      },

      getRecentProjectsSorted: () => {
        const state = get();
        return [...state.recentProjects].sort(
          (a, b) =>
            new Date(b.lastAccessed).getTime() -
            new Date(a.lastAccessed).getTime(),
        );
      },

      setRuntime: (runtime) => {
        set({ runtime });
        syncWithRuntime(runtime);
      },

      loadProject: async () => {
        const { runtime } = get();
        if (!runtime) return;

        const program = Effect.gen(function* () {
          const projectClient = yield* ProjectClient;
          const project = yield* projectClient.loadProject();
          console.log('Project loaded:', project);
          return project;
        });

        return await runtime.runPromise(program);
      },
    })),
    { name: 'projects-store' },
  ),
);

const syncWithRuntime = async (runtime: LiveManagedRuntime) => {
  const loadCurrentProjectEffect = Effect.gen(function* () {
    const client = yield* SettingsClient;
    const project = yield* client.getSetting<any>(KEY_CURRENT_PROJECT);
    return project
      ? {
          ...project,
          lastAccessed: new Date(project.lastAccessed),
        }
      : null;
  });

  const loadRecentProjectsEffect = Effect.gen(function* () {
    const client = yield* SettingsClient;
    const projects = yield* client.getSetting<any[]>(KEY_RECENT_PROJECTS);
    return (
      projects?.map((p: any) => ({
        ...p,
        lastAccessed: new Date(p.lastAccessed),
      })) || []
    );
  });

  try {
    const [savedCurrentProject, savedRecentProjects] = await Promise.all([
      runtime.runPromise(loadCurrentProjectEffect).catch(() => null),
      runtime.runPromise(loadRecentProjectsEffect).catch(() => []),
    ]);

    const currentState = useProjectsStoreInner.getState();

    if (savedCurrentProject) {
      const currentProject = currentState.currentProject;
      const shouldUpdate =
        !currentProject ||
        savedCurrentProject.name !== currentProject.name ||
        savedCurrentProject.path !== currentProject.path ||
        savedCurrentProject.configPath !== currentProject.configPath;

      if (shouldUpdate) {
        useProjectsStoreInner.setState({ currentProject: savedCurrentProject });
      }
    }

    if (
      savedRecentProjects &&
      savedRecentProjects.length !== currentState.recentProjects.length
    ) {
      useProjectsStoreInner.setState({ recentProjects: savedRecentProjects });
    }
  } catch (error) {
    console.warn('Failed to sync projects with database:', error);
  }
};

useProjectsStoreInner.subscribe(
  (state) => ({
    currentProject: state.currentProject,
    recentProjects: state.recentProjects,
    runtime: state.runtime,
  }),
  async ({ currentProject, recentProjects, runtime }) => {
    if (!runtime) return;

    const saveCurrentProjectEffect = Effect.gen(function* () {
      const client = yield* SettingsClient;
      const serializedProject = currentProject
        ? {
            ...currentProject,
            lastAccessed: currentProject.lastAccessed.toISOString(),
          }
        : null;
      yield* client.setSetting(KEY_CURRENT_PROJECT, serializedProject);
    });

    const saveRecentProjectsEffect = Effect.gen(function* () {
      const client = yield* SettingsClient;
      const serializedProjects = recentProjects.map((p) => ({
        ...p,
        lastAccessed: p.lastAccessed.toISOString(),
      }));
      yield* client.setSetting(KEY_RECENT_PROJECTS, serializedProjects);
    });

    try {
      await Promise.all([
        runtime.runPromise(saveCurrentProjectEffect),
        runtime.runPromise(saveRecentProjectsEffect),
      ]);
    } catch (error) {
      console.error('Failed to save projects to database:', error);
    }
  },
  { fireImmediately: false },
);
