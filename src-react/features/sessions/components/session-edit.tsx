import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { FileIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Effect } from 'effect';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { runtime } from '@/config/runtime';
import { SettingsClient } from '@/services/common/settings-client';
import { SessionClient } from '@/services/common/session-client';
import { Session } from '@/types/session';

interface SessionEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSession: Session | null;
}

const updateSessionEffect = (sessionData: {
  name: string;
  path: string;
  filePath?: string;
  originalPath: string;
}) =>
  Effect.gen(function* () {
    const settingsClient = yield* SettingsClient;
    const sessionClient = yield* SessionClient;

    if (sessionData.filePath) {
      yield* sessionClient.setSessionConfigWithFile(
        sessionData.name,
        sessionData.path,
        sessionData.filePath,
        null,
      );
    } else {
      yield* sessionClient.setSessionConfig(sessionData.name, sessionData.path);
    }

    const updatedSession: Session = {
      name: sessionData.name,
      path: sessionData.path,
      lastAccessed: new Date(),
    };

    yield* settingsClient.setSetting('session-current', updatedSession);

    const currentList = yield* settingsClient
      .getSetting<Session[]>('sessions-list')
      .pipe(Effect.catchAll(() => Effect.succeed([])));

    const updatedList = currentList.map((session: Session) =>
      session.path === sessionData.originalPath ? updatedSession : session,
    );

    yield* settingsClient.setSetting('sessions-list', updatedList);

    return updatedSession;
  });

export const SessionEdit = ({
  open,
  onOpenChange,
  currentSession,
}: SessionEditProps) => {
  const [sessionName, setSessionName] = useState('');
  const [sessionPath, setSessionPath] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (open && currentSession) {
      setSessionName(currentSession.name || '');
      setSessionPath(currentSession.path || '');
      setConfigPath('');
    }
  }, [open, currentSession]);

  const handleSelectConfigFile = async () => {
    try {
      const selectedPath = await openDialog({
        directory: false,
        multiple: false,
        filters: [
          {
            name: 'Config',
            extensions: ['toml'],
          },
        ],
      });

      if (selectedPath) {
        setConfigPath(selectedPath.toString());
      }
    } catch (err) {
      console.error('Error selecting config file:', err);
    }
  };

  const handleUpdateSession = async () => {
    if (!sessionName.trim() || !currentSession) {
      return;
    }

    setIsUpdating(true);

    try {
      const sessionData = {
        name: sessionName.trim(),
        path: sessionPath.trim() || currentSession.path,
        filePath: configPath || undefined,
        originalPath: currentSession.path,
      };

      await runtime.runPromise(updateSessionEffect(sessionData));

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating session:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (currentSession) {
      setSessionName(currentSession.name || '');
      setSessionPath(currentSession.path || '');
      setConfigPath('');
    }
    onOpenChange(false);
  };

  const isValid = sessionName.trim().length > 0;
  const hasChanges =
    currentSession &&
    (sessionName.trim() !== currentSession.name ||
      sessionPath.trim() !== currentSession.path ||
      configPath.length > 0);

  if (!currentSession) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>
            Modify the session name, path, and update configuration file.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-session-name">Session Name *</Label>
            <Input
              id="edit-session-name"
              placeholder="Enter session name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-session-path">Session Path</Label>
            <Input
              id="edit-session-path"
              placeholder="Enter session path"
              value={sessionPath}
              onChange={(e) => setSessionPath(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-config-file">Configuration File (TOML)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-config-file"
                placeholder="No file selected"
                value={configPath ? configPath.split('/').pop() : ''}
                readOnly
                className="flex-1 bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectConfigFile}
                className="flex items-center gap-2"
              >
                <FileIcon className="size-4" />
                Browse
              </Button>
            </div>
            {configPath && (
              <p className="text-xs text-muted-foreground truncate">
                {configPath}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpdateSession}
            disabled={!isValid || !hasChanges || isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
