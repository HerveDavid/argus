import React from 'react';
import {
  EllipsisVertical,
  Undo2,
  Redo2,
  Play,
  Bug,
  Pen,
  LassoSelect,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SldBreadcrumb } from '../sld-breadcrumb';

type SdlToolsProps = {
  id: string;
};

export const SldTools: React.FC<SdlToolsProps> = ({ id }) => {
  return (
    <TooltipProvider>
      <div className="flex min-w-0 items-center">
        <EllipsisVertical
          size={16}
          className="text-muted-foreground mr-2 flex-shrink-0"
        />
        <SldBreadcrumb id={id} />
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
                <Pen size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={true}
                className="h-8 w-8 p-0"
              >
                <LassoSelect size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent></TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};
