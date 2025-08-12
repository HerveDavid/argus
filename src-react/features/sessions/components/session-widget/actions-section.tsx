import { Plus } from 'lucide-react';

import { MenubarItem } from '@/components/ui/menubar';

export const ActionsSection = ({
  onCreateSession,
}: {
  onCreateSession: () => void;
}) => (
  <>
    <div className="px-2 py-1.5 text-xs text-muted-foreground">Actions</div>
    <MenubarItem onClick={onCreateSession} className="flex items-center gap-2">
      <Plus className="size-4" />
      <span>Create New Session...</span>
    </MenubarItem>
  </>
);
