import React from 'react';

import { MenubarItem } from '@/components/ui/menubar';
import { Session } from '@/types/session';

// import { formatProjectDate } from '../../utils/utils';

import { SessionAvatar } from './session-avatar';
import { SessionFiles } from './session-files';
import { RemoveSessionButton } from './remove-session-button';

export const RecentSessionItem = ({
  session,
  onSwitch,
  onRemove,
}: {
  session: Session;
  onSwitch: (session: Session) => void;
  onRemove: (projectPath: string, e: React.MouseEvent) => void;
}) => (
  <MenubarItem
    key={session.path}
    onClick={() => onSwitch(session)}
    className="flex items-center gap-2 group cursor-pointer hover:bg-sidebar-accent"
  >
    <SessionAvatar name={session.name} className="size-6 bg-blue-500" />
    <div className="flex-1 min-w-0">
      <div className="font-medium truncate text-foreground">{session.name}</div>
      <div className="text-xs text-muted-foreground truncate">
        {session.path}
      </div>
      <div className="flex items-center justify-between mt-1">
        <SessionFiles path={session.path} />
        <div className="text-xs text-muted-foreground">
          {/* {formatProjectDate(session.lastAccessed)} */}
          {session.lastAccessed.getDate()}
        </div>
      </div>
    </div>
    <RemoveSessionButton onClick={(e) => onRemove(session.path, e)} />
  </MenubarItem>
);
