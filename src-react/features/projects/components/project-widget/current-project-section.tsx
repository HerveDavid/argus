import { FileIcon } from 'lucide-react';
import React from 'react';

import { MenubarItem, MenubarSeparator } from '@/components/ui/menubar';

import { EditProjectButton } from './edit-project-button';
import { ProjectAvatar } from './project-avatar';

export const CurrentProjectSection = ({
  project,
  projectPath,
  configPath,
  onEdit,
}: {
  project: string;
  projectPath: string;
  configPath?: string;
  onEdit: (e: React.MouseEvent) => void;
}) => (
  <>
    <div className="px-2 py-1.5 text-xs text-muted-foreground">
      Current Project
    </div>
    <MenubarItem className="flex items-center gap-2 group">
      <ProjectAvatar name={project} />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{project}</div>
        <div className="text-xs text-muted-foreground truncate">
          {projectPath}
        </div>
        <div className="flex gap-2 mt-1">
          {configPath && (
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
