import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EllipsisIcon } from 'lucide-react';

export const Tools = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <EllipsisIcon className="size-5"></EllipsisIcon>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => console.log('add workspace')}>
          Add to workspace
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
