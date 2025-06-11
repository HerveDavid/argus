import React from 'react';

import { MenubarItem } from '@/components/ui/menubar';
import { Project } from '@/types/project';

import { formatProjectDate } from '../../utils/utils';

import { ProjectAvatar } from './project-avatar';
import { ProjectFiles } from './project-files';
import { RemoveProjectButton } from './remove-project-button';

export const RecentProjectItem = ({
  project,
  onSwitch,
  onRemove,
}: {
  project: Project;
  onSwitch: (project: Project) => void;
  onRemove: (projectPath: string, e: React.MouseEvent) => void;
}) => (
  <MenubarItem
    key={project.path}
    onClick={() => onSwitch(project)}
    className="flex items-center gap-2 group cursor-pointer hover:bg-sidebar-accent"
  >
    <ProjectAvatar name={project.name} className="size-6 bg-blue-500" />
    <div className="flex-1 min-w-0">
      <div className="font-medium truncate text-foreground">{project.name}</div>
      <div className="text-xs text-muted-foreground truncate">
        {project.path}
      </div>
      <div className="flex items-center justify-between mt-1">
        <ProjectFiles configPath={project.configPath} />
        <div className="text-xs text-muted-foreground">
          {formatProjectDate(project.lastAccessed)}
        </div>
      </div>
    </div>
    <RemoveProjectButton onClick={(e) => onRemove(project.path, e)} />
  </MenubarItem>
);
