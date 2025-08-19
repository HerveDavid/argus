import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { Effect } from 'effect';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { rxRuntime, runtime } from '@/config/runtime';
import { SettingsClient } from '@/services/common/settings-client';
import { SessionClient } from '@/services/common/session-client';
import { useRxValue, Result } from '@effect-rx/rx-react';
import { Session } from '@/types/session';

import { ActionsSection } from './session-widget/actions-section';
import { CurrentProjectSection } from './session-widget/current-project-section';
import { EmptyState } from './session-widget/empty-state';
import { RecentSessionsSection } from './session-widget/recent-sessions-section';
import { SessionCreate } from './session-create';
import { SessionEdit } from './session-edit';
import { SessionData } from '../types/session-data';

interface SessionSettings {
  current: Session | null;
  recentList: Session[];
}

const getSessionsRx = rxRuntime.rx(
  Effect.fn(function* () {
    const settingsClient = yield* SettingsClient;

    const currentSession = yield* settingsClient
      .getSetting<Session>('session-current')
      .pipe(Effect.catchAll(() => Effect.succeed(null)));

    const sessionsList = yield* settingsClient
      .getSetting<Session[]>('sessions-list')
      .pipe(Effect.catchAll(() => Effect.succeed([])));

    return {
      current: currentSession,
      recentList: sessionsList,
    } satisfies SessionSettings;
  }),
);

const switchSessionEffect = (session: Session) =>
  Effect.gen(function* () {
    const settingsClient = yield* SettingsClient;
    const sessionClient = yield* SessionClient;

    yield* sessionClient.setSessionConfig(session.name, session.path);
    yield* settingsClient.setSetting('session-current', session);

    const currentList = yield* settingsClient
      .getSetting<Session[]>('sessions-list')
      .pipe(Effect.catchAll(() => Effect.succeed([])));

    const updatedSession = { ...session, lastAccessed: new Date() };
    const filteredList = currentList.filter(
      (s: Session) => s.path !== session.path,
    );
    const newList = [updatedSession, ...filteredList].slice(0, 10);

    yield* settingsClient.setSetting('sessions-list', newList);

    return updatedSession;
  });

const createSessionEffect = (sessionData: SessionData) =>
  Effect.gen(function* () {
    const settingsClient = yield* SettingsClient;
    const sessionClient = yield* SessionClient;

    const config = yield* sessionClient.setSessionConfig(
      sessionData.name,
      sessionData.filePath,
    );

    const newSession: Session = {
      name: sessionData.name,
      path: sessionData.path,
      lastAccessed: new Date(),
    };

    yield* settingsClient.setSetting('session-current', newSession);

    const currentList = yield* settingsClient
      .getSetting<Session[]>('sessions-list')
      .pipe(Effect.catchAll(() => Effect.succeed([])));

    const filteredList = currentList.filter(
      (s: Session) => s.path !== newSession.path,
    );
    const newList = [newSession, ...filteredList].slice(0, 10);

    yield* settingsClient.setSetting('sessions-list', newList);

    return { session: newSession, config };
  });

const removeSessionEffect = (sessionPath: string) =>
  Effect.gen(function* () {
    const settingsClient = yield* SettingsClient;

    const currentList = yield* settingsClient
      .getSetting<Session[]>('sessions-list')
      .pipe(Effect.catchAll(() => Effect.succeed([])));

    const newList = currentList.filter((s: Session) => s.path !== sessionPath);
    yield* settingsClient.setSetting('sessions-list', newList);

    return newList;
  });

const clearRecentSessionsEffect = () =>
  Effect.gen(function* () {
    const settingsClient = yield* SettingsClient;
    yield* settingsClient.setSetting('sessions-list', []);
    return [];
  });

export const SessionWidget = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const sessionsResult = useRxValue(getSessionsRx);

  const handleSwitchSession = async (session: Session) => {
    try {
      await runtime.runPromise(switchSessionEffect(session));
    } catch (error) {
      console.error('Error switching session:', error);
    }
  };

  const handleCreateSession = async (sessionData: SessionData) => {
    try {
      await runtime.runPromise(createSessionEffect(sessionData));
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleRemoveSession = async (
    sessionPath: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      await runtime.runPromise(removeSessionEffect(sessionPath));
    } catch (error) {
      console.error('Error removing session:', error);
    }
  };

  const handleClearRecentSessions = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await runtime.runPromise(clearRecentSessionsEffect());
    } catch (error) {
      console.error('Error clearing recent sessions:', error);
    }
  };

  const handleEditCurrentSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditDialog(true);
  };

  return Result.match(sessionsResult, {
    onFailure: (error) => (
      <div className="text-red-500 text-sm">Error: {JSON.stringify(error)}</div>
    ),
    onSuccess: (sessions) => {
      const sessionData = sessions.value || sessions;

      if (!sessionData || typeof sessionData !== 'object') {
        return (
          <div className="text-red-500 text-sm">No session data available</div>
        );
      }

      const { current: currentSession } = sessionData;
      const recentList = Array.isArray(sessionData.recentList)
        ? sessionData.recentList
        : [];

      const sortedRecentSessions = recentList
        .filter((session) => session.path !== currentSession?.path)
        .sort(
          (a, b) =>
            new Date(b.lastAccessed).getTime() -
            new Date(a.lastAccessed).getTime(),
        );

      const displayName = currentSession?.name || 'No Session';
      const initials = displayName.slice(0, 2).toUpperCase();
      const hasRecentSessions = sortedRecentSessions.length > 0;
      const hasNoSessions = !currentSession && !hasRecentSessions;

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
              {currentSession && (
                <CurrentProjectSection
                  project={currentSession}
                  onEdit={handleEditCurrentSession}
                />
              )}
              <ActionsSection
                onCreateSession={() => setShowCreateDialog(true)}
              />
              {hasRecentSessions && (
                <RecentSessionsSection
                  sessions={sortedRecentSessions}
                  onSwitch={handleSwitchSession}
                  onRemove={handleRemoveSession}
                  onClearAll={handleClearRecentSessions}
                />
              )}
              {hasNoSessions && <EmptyState />}
            </MenubarContent>
          </MenubarMenu>

          <SessionCreate
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onCreateSession={handleCreateSession}
          />
          <SessionEdit
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            currentSession={currentSession}
          />
        </>
      );
    },
    onInitial: () => (
      <div className="flex items-center gap-x-2 opacity-50">
        <Avatar className="size-4">
          <AvatarFallback className="text-xs font-medium bg-gray-400">
            --
          </AvatarFallback>
        </Avatar>
        <p className="truncate max-w-32">Loading...</p>
        <ChevronDown className="size-4" />
      </div>
    ),
  });
};
