import { LazyStore } from '@tauri-apps/plugin-store';
import { Project } from '../types/project.type';

class ProjectsStoreManager {
  private static instance: ProjectsStoreManager;
  private store: LazyStore;

  private constructor() {
    this.store = new LazyStore('projects-store.json', { autoSave: true });
  }

  public static getInstance(): ProjectsStoreManager {
    if (!ProjectsStoreManager.instance) {
      ProjectsStoreManager.instance = new ProjectsStoreManager();
    }
    return ProjectsStoreManager.instance;
  }

  async setCurrentProject(project: Project): Promise<void> {
    await this.store.set('project', { currentProject: project });
    await this.store.save();
  }

  async getCurrentProject(): Promise<Project | null> {
    const data = await this.store.get('project');
    return data ? (data as any).currentProject : null;
  }

  async getProjects(): Promise<Project[]> {
    const data = await this.store.get('projects');
    return data ? (data as Project[]) : [];
  }

  async addProject(project: Project): Promise<void> {
    const projects = await this.getProjects();
    await this.store.set('projects', [...projects, project]);
    await this.store.save();
  }

  async removeProject(projectName: string): Promise<void> {
    const projects = await this.getProjects();
    const updatedProjects = projects.filter(
      (project) => project.name !== projectName,
    );
    await this.store.set('projects', updatedProjects);
    await this.store.save();

    const currentProject = await this.getCurrentProject();
    if (currentProject?.name === projectName) {
      await this.store.set('project', { currentProject: null });
      await this.store.save();
    }
  }
}

export const projectsStore = ProjectsStoreManager.getInstance();
