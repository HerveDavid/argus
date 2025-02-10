import { create } from 'zustand';
import { Settings } from '../types/settings.type';

export interface ProjectSettingsState {
    settings: Settings;
    loading: boolean;
    error: Error | null;
    setSettings: (settings: Settings) => Promise<void>;
}

export const useProjectSettings = create<ProjectSettingsState>((set) => ({
    settings: { gridFile: undefined, networkFile: undefined },
    loading: false,
    error: null,
    setSettings: async (settings) => set({ settings }),
}));