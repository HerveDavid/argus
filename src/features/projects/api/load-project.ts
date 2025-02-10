import { LazyStore } from '@tauri-apps/plugin-store';
import { Project } from '../types/project.type';
import { Settings } from '../types/settings.type';


class ProjectStoreManager {
    private static instance: ProjectStoreManager;
    private store: LazyStore;

    private constructor() {
        this.store = new LazyStore('settings.json', { autoSave: true });
    }

    public static getInstance(): ProjectStoreManager {
        if (!ProjectStoreManager.instance) {
            ProjectStoreManager.instance = new ProjectStoreManager();
        }
        return ProjectStoreManager.instance;
    }

    async loadProject(project: Project): Promise<void> {
        await this.store.set('project', { currentProject: project });
        await this.store.save();
    }

    async getCurrentProject(): Promise<Project | null> {
        const data = await this.store.get('project');
        return data ? (data as any).currentProject : null;
    }

    async addProject(project: Project): Promise<void> {
        const projects = await this.getProjects();
        await this.store.set('projects', [...projects, project]);
        await this.store.save();
    }

    async getProjects(): Promise<Project[]> {
        const data = await this.store.get('projects');
        return data ? (data as Project[]) : [];
    }

    async saveSettings(settings: Settings): Promise<void> {
        await this.store.set('settings', settings);
        await this.store.save();
    }

    async getSettings(): Promise<Settings | null> {
        const data = await this.store.get('settings');
        return data ? (data as Settings) : null;
    }
}

export const projectStore = ProjectStoreManager.getInstance();
