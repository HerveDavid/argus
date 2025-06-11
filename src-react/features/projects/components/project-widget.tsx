import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { useProjectsStore } from '@/features/projects';
import { Project } from '@/types/project';

import { getProjectInitials } from '../utils/utils';

import { ProjectCreate } from './project-create';
import { ProjectEdit } from './project-edit';
import { ActionsSection } from './project-widget/actions-section';
import { CurrentProjectSection } from './project-widget/current-project-section';
import { EmptyState } from './project-widget/empty-state';
import { RecentProjectsSection } from './project-widget/recent-projects-section';

export const ProjectWidget = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const {
    currentProject,
    currentProjectPath,
    currentConfigPath,
    switchToProject,
    removeRecentProject,
    clearRecentProjects,
    getRecentProjectsSorted,
  } = useProjectsStore();

  const handleSwitchProject = (project: Project) => switchToProject(project);
  const handleRemoveProject = (projectPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentProject(projectPath);
  };
  const handleClearRecentProjects = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentProjects();
  };
  const handleEditCurrentProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditDialog(true);
  };

  const sortedRecentProjects = getRecentProjectsSorted().filter(
    (project) => project.path !== currentProjectPath,
  );

  const displayName = currentProject || 'No Project';
  const initials = getProjectInitials(currentProject);
  const hasRecentProjects = sortedRecentProjects.length > 0;
  const hasNoProjects = !currentProject && !hasRecentProjects;

  return (
    <>
      <MenubarMenu>
        <MenubarTrigger>
          <div className="flex items-center gap-x-2">
            <Avatar className="size-4">
              <AvatarFallback className="text-xs font-medium bg-blue-600">
                {initials}
              </AvatarFallback>
            </Avatar>
            <p className="truncate max-w-32">{displayName}</p>
            <ChevronDown className="size-4" />
          </div>
        </MenubarTrigger>

        <MenubarContent className="w-80">
          {currentProject && (
            <CurrentProjectSection
              project={currentProject}
              projectPath={currentProjectPath}
              configPath={currentConfigPath}
              onEdit={handleEditCurrentProject}
            />
          )}

          <ActionsSection onCreateProject={() => setShowCreateDialog(true)} />

          {hasRecentProjects && (
            <RecentProjectsSection
              projects={sortedRecentProjects}
              onSwitch={handleSwitchProject}
              onRemove={handleRemoveProject}
              onClearAll={handleClearRecentProjects}
            />
          )}

          {hasNoProjects && <EmptyState />}
        </MenubarContent>
      </MenubarMenu>

      <ProjectCreate
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      <ProjectEdit open={showEditDialog} onOpenChange={setShowEditDialog} />
    </>
  );
};
