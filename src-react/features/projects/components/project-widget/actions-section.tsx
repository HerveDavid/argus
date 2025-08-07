import { Plus } from 'lucide-react';

import { MenubarItem } from '@/components/ui/menubar';

export const ActionsSection = ({
  onCreateProject,
}: {
  onCreateProject: () => void;
}) => (
  <>
    <div className="px-2 py-1.5 text-xs text-muted-foreground">Actions</div>
    <MenubarItem onClick={onCreateProject} className="flex items-center gap-2">
      <Plus className="size-4" />
      <span>Create New Project...</span>
    </MenubarItem>
  </>
);
