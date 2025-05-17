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


export default function FileSelector() {
  const [filePath, setFilePath] = useState('No file selected');

  const handleSelectFile = async () => {
    try {
      const selectedPath = await openDialog({
        directory: false,
        multiple: false,
        filters: [
          {
            name: "Config",
            extensions: ["toml"],
          }
        ]
      });

      if (selectedPath) {
        setFilePath(selectedPath.toString());
      }
    } catch (err) {
      console.error('Error selecting file:', err);
    }
  };

  return (
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
  );
}
