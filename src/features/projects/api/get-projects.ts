import { Project } from '../types/project.type';

export const getProjects = (): Promise<{ data: Project[] }> => {
  const data: Project[] = [
    {
      name: 'embedded-powsybl',
      path: '~/Projects/TwinEu/Argus/embedded-powsybl-1',
      color: 'bg-orange-500',
    },
    {
      name: 'embedded-powsybl',
      path: '~/Projects/TwinEu/Argus/embedded-powsybl-2',
      color: 'bg-red-500',
    },
    {
      name: 'test',
      path: '~/Projects/TwinEu/Argus/embedded-powsybl-3',
      color: 'bg-red-500',
    },
  ];

  return Promise.resolve({ data });
};
