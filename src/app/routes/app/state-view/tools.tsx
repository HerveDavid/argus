import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspaceStore } from '@/features/workspace/stores/use-workspace.store';
import { Substation } from '@/types/substation.type';
import { EllipsisIcon } from 'lucide-react';

export const Tools: React.FC<{ substation: Substation }> = ({ substation }) => {
  const { addSubstation } = useWorkspaceStore();

  const addToWorkspace = () => {
    addSubstation(substation);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <EllipsisIcon className="size-5"></EllipsisIcon>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={addToWorkspace}>
          Add to workspace
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
