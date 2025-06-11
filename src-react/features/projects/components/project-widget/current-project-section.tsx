import { FileIcon } from 'lucide-react';
import React from 'react';

import { MenubarItem, MenubarSeparator } from '@/components/ui/menubar';
import { Project } from '@/types/project';

import { EditProjectButton } from './edit-project-button';
import { ProjectAvatar } from './project-avatar';

export const CurrentProjectSection = ({
  project,
  onEdit,
}: {
  project: Project;
  onEdit: (e: React.MouseEvent) => void;
}) => (
  <>
    <div className="px-2 py-1.5 text-xs text-muted-foreground">
      Current Project
    </div>
    <MenubarItem className="flex items-center gap-2 group">
      <ProjectAvatar name={project.name} />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{project.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {project.path}
        </div>
        <div className="flex gap-2 mt-1">
          {project.configPath && (
            <div className="flex items-center gap-1 text-xs text-chart-2">
              <FileIcon className="size-3" />
              TOML
            </div>
          )}
        </div>
      </div>
      <EditProjectButton onClick={onEdit} />
    </MenubarItem>
    <MenubarSeparator />
  </>
);
