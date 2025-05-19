import { useState } from 'react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FolderIcon } from 'lucide-react';
import {
  loadGameMasterOutputs,
  loadIidm,
  setConfig,
  setIidmConfig,
} from '@/features/settings/components/config/api';
import { Effect } from 'effect';

export default function FileSelector() {
  const [filePath, setFilePath] = useState('No file selected');
  const [iidmPath, setIidmPath] = useState('No file selected');

  const handleSelectFile = async () => {
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
        setFilePath(selectedPath.toString());
        Effect.runPromise(setConfig(selectedPath.toString()))
          .then(console.log)
          .catch(console.error);
        Effect.runPromise(loadGameMasterOutputs())
          .then(console.log)
          .catch(console.error);
      }
    } catch (err) {
      console.error('Error selecting file:', err);
    }
  };

  const handleSelectIIDMFile = async () => {
    try {
      const selectedPath = await openDialog({
        directory: false,
        multiple: false,
        filters: [
          {
            name: 'IIDM',
            extensions: ['xiidm', 'iidm'],
          },
        ],
      });

      if (selectedPath) {
        setIidmPath(selectedPath.toString());
        Effect.runPromise(setIidmConfig(selectedPath.toString()))
          .then(console.log)
          .catch(console.error);
        Effect.runPromise(loadIidm()).then(console.log).catch(console.error);
      }
    } catch (err) {
      console.error('Error selecting iidm file:', err);
    }
  };

  return (
    <>
      <Card className="shadow-xs bg-card">
        <CardHeader className="bg-muted border-b pb-4">
          <CardTitle className="text-md font-bold text-card-foreground">
            Configuration File
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Select a TOML configuration file
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">
              File Path
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-grow p-3 bg-muted text-foreground rounded-md font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                {filePath}
              </div>
              <Button
                type="button"
                onClick={handleSelectFile}
                className="flx items-center gap-2"
              >
                <FolderIcon size={16} />
                Browse
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select a TOML configuration file from your system
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-xs bg-card mt-6">
        <CardHeader className="bg-muted border-b pb-4">
          <CardTitle className="text-md font-bold text-card-foreground">
            IIDM File
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Select a IIDM configuration file
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">
              File Path
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-grow p-3 bg-muted text-foreground rounded-md font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                {iidmPath}
              </div>
              <Button
                type="button"
                onClick={handleSelectIIDMFile}
                className="flx items-center gap-2"
              >
                <FolderIcon size={16} />
                Browse
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select a IIDM configuration file from your system
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
