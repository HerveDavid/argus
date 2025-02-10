import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FileSliders } from 'lucide-react';

export const LeftPanel = () => {
  return (
    <>
      <div className="flex-shrink-0 border-r flex flex-col items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <FileSliders className="h-8 w-8" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Project Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};
