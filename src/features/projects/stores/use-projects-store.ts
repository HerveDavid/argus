import { create } from 'zustand';
import { Project } from '../types/project';
import { getProjects } from '../api/get-projects';

export interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: Error | null;
  fetchProjects: () => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  loading: false,
  error: null,
  fetchProjects: async () => {
    set({ loading: true });

    try {
      const { data } = await getProjects();
      set({ projects: data, error: null });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err : new Error('Failed to fetch projects'),
      });
    } finally {
      set({ loading: false });
    }
  },
}));
