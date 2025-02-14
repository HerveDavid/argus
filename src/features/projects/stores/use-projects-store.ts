import { create } from 'zustand';
import { Project } from '../types/project.type';
import { Settings } from '../types/settings.type';
import { projectsStore } from '../api/projects-store';

interface ProjectsState {
  // État du projet actuel
  currentProject: Project | undefined;
  settings: Settings | undefined;

  // État de la liste des projets
  projects: Project[];
  loading: boolean;
  error: Error | null;

  // Actions pour le projet actuel
  setCurrentProject: (project: Project) => Promise<void>;
  loadStoredProject: () => Promise<void>;

  // Actions pour la liste des projets
  fetchProjects: () => Promise<void>;
  addProject: (project: Project) => Promise<void>;
  removeProject: (projectName: string) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  // État initial
  currentProject: undefined,
  settings: undefined,
  projects: [],
  loading: false,
  error: null,

  // Actions pour le projet actuel
  setCurrentProject: async (project: Project) => {
    try {
      await projectsStore.setCurrentProject(project);
      set({ currentProject: project });
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err
            : new Error('Failed to set current project'),
      });
    }
  },

  loadStoredProject: async () => {
    try {
      const project = await projectsStore.getCurrentProject();
      if (project) {
        set({ currentProject: project });
      }
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err
            : new Error('Failed to load stored project'),
      });
    }
  },

  // Actions pour la liste des projets
  fetchProjects: async () => {
    set({ loading: true });
    try {
      const data = await projectsStore.getProjects();
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

  addProject: async (project: Project) => {
    try {
      await projectsStore.addProject(project);
      const projects = get().projects;
      set({ projects: [...projects, project] });
    } catch (err) {
      set({
        error: err instanceof Error ? err : new Error('Failed to add project'),
      });
    }
  },

  removeProject: async (projectName: string) => {
    try {
      const projects = get().projects;
      // Vérifier si c'est le projet actuel
      const currentProject = get().currentProject;
      if (currentProject?.name === projectName) {
        set({ currentProject: undefined });
      }

      // Filtrer le projet à supprimer
      const updatedProjects = projects.filter(
        (project) => project.name !== projectName,
      );

      // Mettre à jour le store persistant
      await projectsStore.removeProject(projectName);

      // Mettre à jour le state
      set({ projects: updatedProjects });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err : new Error('Failed to remove project'),
      });
    }
  },
}));
