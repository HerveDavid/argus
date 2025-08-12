import { FileIcon } from 'lucide-react';
import React from 'react';

import { MenubarItem, MenubarSeparator } from '@/components/ui/menubar';
import { Session } from '@/types/session';

import { EditSessionButton } from './edit-session-button';
import { SessionAvatar } from './session-avatar';

export const CurrentProjectSection = ({
  project: session,
  onEdit,
}: {
  project: Session;
  onEdit: (e: React.MouseEvent) => void;
}) => (
  <>
    <div className="px-2 py-1.5 text-xs text-muted-foreground">
      Current Session
    </div>
    <MenubarItem className="flex items-center gap-2 group">
      <SessionAvatar name={session.name} />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{session.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {session.path}
        </div>
        <div className="flex gap-2 mt-1">
          {session.path && (
            <div className="flex items-center gap-1 text-xs text-chart-2">
              <FileIcon className="size-3" />
              TOML
            </div>
          )}
        </div>
      </div>
      <EditSessionButton onClick={onEdit} />
    </MenubarItem>
    <MenubarSeparator />
  </>
);
