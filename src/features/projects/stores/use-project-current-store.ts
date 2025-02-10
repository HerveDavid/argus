import { create } from "zustand";
import { Project } from "../types/project.type";

export interface ProjectCurrentState {
    project: Project | undefined;
    setProject: (project: Project) => void;
}

export const useProjectCurrent = create<ProjectCurrentState>((set) => ({
    project: undefined,
    setProject: (project) => { set({ project }); console.log(project) }
}))