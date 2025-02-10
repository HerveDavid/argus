import { create } from "zustand";
import { Project } from "../types/project.type";
import { projectStore } from "../api/load-project";
import { Settings } from "../types/settings.type";

interface ProjectState {
    project: Project | undefined;
    settings: Settings | undefined;
    setProject: (project: Project) => Promise<void>;
    loadStoredProject: () => Promise<void>;
    setSettings: (settings: Settings) => Promise<void>;
    loadSettings: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
    project: undefined,
    settings: undefined,

    setProject: async (project: Project) => {
        await projectStore.loadProject(project);
        set({ project });
    },

    loadStoredProject: async () => {
        const project = await projectStore.getCurrentProject();
        if (project) {
            set({ project });
        }
    },

    setSettings: async (settings: Settings) => {
        await projectStore.saveSettings(settings);
        set({ settings });
        projectStore.getSettings().then(console.log)
    },

    loadSettings: async () => {
        const settings = await projectStore.getSettings();
        if (settings) {
            set({ settings });
        }
    }
}));