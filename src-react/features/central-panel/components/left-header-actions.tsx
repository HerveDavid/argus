import { IDockviewHeaderActionsProps } from 'dockview';
import { EllipsisVertical } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LeftHeaderActions = (_props: IDockviewHeaderActionsProps) => {
  return (
    <div className="h-full flex items-center px-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-accent rounded-sm hover:text-accent-foreground text-muted-foreground">
          <EllipsisVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Close All</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Lock Groups</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Detach Panel</DropdownMenuItem>
          <DropdownMenuItem>Detach Groups</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
