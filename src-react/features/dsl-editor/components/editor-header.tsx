import { EllipsisVertical, Undo2, Redo2, Play, Bug, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { invoke } from '@tauri-apps/api/core';

export const Header = ({ filepath }: { filepath: String }) => {
  const onInitScenario = async () => {
    await invoke('init_dsl_file')
      .catch(console.error)
      .then((msg) => {
        console.log(msg);
      });
  };

  return (
    <TooltipProvider>
      <header className="bg-sidecar flex items-center justify-between border-b px-1">
        <div className="flex min-w-0 items-center">
          <EllipsisVertical
            size={16}
            className="text-muted-foreground mr-2 flex-shrink-0"
          />
          <h1 className="text-muted-foreground truncate text-xs font-medium">
            {filepath}
          </h1>
        </div>

        <div className="ml-4 flex items-center gap-1">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={true}
                  className="h-8 w-8 p-0"
                >
                  <Undo2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={true}
                  className="h-8 w-8 p-0"
                >
                  <Redo2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="hidden sm:block" />

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={onInitScenario}
                >
                  <Play size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Play Scenario</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bug size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Debug Scenario</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};
