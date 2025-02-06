import { Project } from "../types/project";

export const getProjects = (): Promise<{data: Project[]}> => {
    const projects: Project[] = [
        {
            name: "embedded-powsybl",
            path: "~/Projects/TwinEu/Argus/embedded-powsybl",
            color: "orange",
        },
        {
            name: "embedded-powsybl",
            path: "~/Projects/TwinEu/Argus/embedded-powsybl",
            color: "red",
        },
    ];

    return Promise.resolve({ data: projects });
} 