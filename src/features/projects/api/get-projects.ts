import { Project } from "../types/project";

export const getProjects = (): Promise<{data: Project[]}> => {
    const projects: Project[] = [
        {
            name: "embedded-powsybl",
            path: "~/Projects/TwinEu/Argus/embedded-powsybl",
            color: "bg-orange-500",
        },
        {
            name: "embedded-powsybl",
            path: "~/Projects/TwinEu/Argus/embedded-powsybl",
            color: "bg-red-500",
        },
        {
            name: "test",
            path: "~/Projects/TwinEu/Argus/embedded-powsybl",
            color: "bg-red-500",
        },
    ];

    return Promise.resolve({ data: projects });
} 