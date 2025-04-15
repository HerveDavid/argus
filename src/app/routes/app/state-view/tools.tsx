import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspaceStore } from '@/features/workspace/stores/use-workspace.store';
import { Substation } from '@/types/substation.type';
import { EllipsisIcon, PinIcon, TrashIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Tools: React.FC<{ substation: Substation }> = ({ substation }) => {
  const { addSubstation, removeSubstation, hasId } = useWorkspaceStore();
  const [isInWorkspace, setIsInWorkspace] = useState(false);

  // Vérifier si la sous-station est dans le workspace
  useEffect(() => {
    if (substation && substation.id) {
      setIsInWorkspace(hasId(substation.id));
    }
  }, [substation, hasId]);

  const toggleWorkspace = () => {
    if (!substation || !substation.id) {
      console.error('Substation or substation.id is undefined');
      return;
    }

    if (isInWorkspace) {
      removeSubstation(substation.id);
    } else {
      addSubstation(substation);
    }
    setIsInWorkspace(!isInWorkspace);
  };

  return (
    <div className="flex space-x-2 mr-2 h-5">
      {isInWorkspace && (
        <PinIcon
          className="size-5 p-0.5 text-blue-500 cursor-pointer"
          onClick={toggleWorkspace}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <EllipsisIcon className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSeparator />
          {isInWorkspace ? (
            <DropdownMenuItem
              onClick={toggleWorkspace}
              className="text-red-500"
            >
              <TrashIcon className="mr-2 size-4" />
              Remove from workspace
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={toggleWorkspace}>
              <PinIcon className="mr-2 size-4" />
              Add to workspace
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
