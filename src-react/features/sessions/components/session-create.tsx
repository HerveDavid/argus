import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { FileIcon } from 'lucide-react';
import { useState } from 'react';

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

interface SessionCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSession: (sessionData: {
    name: string;
    path: string;
    filePath: string;
  }) => void;
}

export const SessionCreate = ({
  open,
  onOpenChange,
  onCreateSession,
}: SessionCreateProps) => {
  const [sessionName, setSessionName] = useState('');
  const [sessionPath, setSessionPath] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
        const pathStr = selectedPath.toString();
        setConfigPath(pathStr);

        if (!sessionName) {
          const fileName = pathStr.split('/').pop()?.replace('.toml', '') || '';
          setSessionName(fileName);
        }

        if (!sessionPath) {
          const directory = pathStr.substring(0, pathStr.lastIndexOf('/'));
          setSessionPath(directory);
        }
      }
    } catch (err) {
      console.error('Error selecting config file:', err);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      return;
    }

    setIsCreating(true);

    try {
      let finalSessionPath = sessionPath.trim();
      if (!finalSessionPath && configPath) {
        finalSessionPath = configPath.substring(0, configPath.lastIndexOf('/'));
      } else if (!finalSessionPath) {
        finalSessionPath = `/Sessions/${sessionName.trim()}`;
      }

      const sessionData = {
        name: sessionName.trim(),
        path: finalSessionPath,
        filePath: configPath,
      };

      onCreateSession(sessionData);

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSessionName('');
    setSessionPath('');
    setConfigPath('');
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const isValid = sessionName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            Create a new session by providing a name, path, and optional config
            file
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="session-name">Session Name *</Label>
            <Input
              id="session-name"
              placeholder="Enter session name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="session-path">Session Path</Label>
            <Input
              id="session-path"
              placeholder="Enter session path (optional)"
              value={sessionPath}
              onChange={(e) => setSessionPath(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="config-file">Configuration File (TOML)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="config-file"
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
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateSession}
            disabled={!isValid || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
