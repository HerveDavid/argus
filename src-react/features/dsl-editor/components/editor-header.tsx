import { EllipsisVertical, Bug } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LoadButton } from '../features/trainer-commands/components/load-button';

export const Header = ({ filepath }: { filepath: String }) => {
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
                <LoadButton />
              </TooltipTrigger>
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
