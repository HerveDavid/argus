import { Clock } from 'lucide-react';
import React from 'react';

import { MenubarItem, MenubarSeparator } from '@/components/ui/menubar';
import { Session } from '@/types/session';

import { RecentSessionItem } from './recent-session-item';

const MAX_RECENT_SESSIONS = 8;

export const RecentSessionsSection = ({
  sessions,
  onSwitch,
  onRemove,
  onClearAll,
}: {
  sessions: Session[];
  onSwitch: (project: Session) => void;
  onRemove: (projectPath: string, e: React.MouseEvent) => void;
  onClearAll: (e: React.MouseEvent) => void;
}) => {
  const visibleProjects = sessions.slice(0, MAX_RECENT_SESSIONS);
  const remainingCount = sessions.length - MAX_RECENT_SESSIONS;

  return (
    <>
      <MenubarSeparator />
      <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="size-3" />
          Recent Projects ({sessions.length})
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-destructive/80 hover:text-destructive"
          title="Clear all recent sessions"
        >
          Clear All
        </button>
      </div>
      {visibleProjects.map((project) => (
        <RecentSessionItem
          key={project.path}
          session={project}
          onSwitch={onSwitch}
          onRemove={onRemove}
        />
      ))}
      {remainingCount > 0 && (
        <MenubarItem
          className="text-center text-xs text-muted-foreground"
          disabled
        >
          +{remainingCount} other sessions
        </MenubarItem>
      )}
    </>
  );
};
