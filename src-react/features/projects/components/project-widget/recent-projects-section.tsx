import { Clock } from 'lucide-react';
import React from 'react';

import { MenubarItem, MenubarSeparator } from '@/components/ui/menubar';
import { Project } from '@/types/project';

import { RecentProjectItem } from './recent-project-item';

const MAX_RECENT_PROJECTS = 8;

export const RecentProjectsSection = ({
  projects,
  onSwitch,
  onRemove,
  onClearAll,
}: {
  projects: Project[];
  onSwitch: (project: Project) => void;
  onRemove: (projectPath: string, e: React.MouseEvent) => void;
  onClearAll: (e: React.MouseEvent) => void;
}) => {
  const visibleProjects = projects.slice(0, MAX_RECENT_PROJECTS);
  const remainingCount = projects.length - MAX_RECENT_PROJECTS;

  return (
    <>
      <MenubarSeparator />
      <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="size-3" />
          Recent Projects ({projects.length})
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-destructive/80 hover:text-destructive"
          title="Clear all recent projects"
        >
          Clear All
        </button>
      </div>
      {visibleProjects.map((project) => (
        <RecentProjectItem
          key={project.path}
          project={project}
          onSwitch={onSwitch}
          onRemove={onRemove}
        />
      ))}
      {remainingCount > 0 && (
        <MenubarItem
          className="text-center text-xs text-muted-foreground"
          disabled
        >
          +{remainingCount} other projects
        </MenubarItem>
      )}
    </>
  );
};
