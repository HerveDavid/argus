import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspaceStore } from '@/features/workspace/stores/use-workspace.store';
import { Substation } from '@/types/substation.type';
import { toast } from 'sonner';
import { EllipsisIcon, PinIcon, TrashIcon } from 'lucide-react';
import { VoltageLevel } from '@/types/voltage-level.type';

function isSubstation(obj: Substation | VoltageLevel): obj is Substation {
  return 'tso' in obj;
}

export const Tools: React.FC<{ element: Substation | VoltageLevel }> = ({
  element,
}) => {
  const {
    addSubstation,
    removeSubstation,
    addVoltageLevel,
    removeVoltageLevel,
    hasId,
  } = useWorkspaceStore();

  const isInWorkspace = element?.id ? hasId(element.id) : false;

  const toggleWorkspace = () => {
    if (!element?.id) {
      console.error('Element or element.id is undefined');
      return;
    }

    if (isInWorkspace) {
      if (isSubstation(element)) {
        removeSubstation(element.id);
        toast.info(`Substation ${element.id} was removed from workspace`, {
          closeButton: true,
        });
      } else {
        removeVoltageLevel(element.id);
        toast.info(`Voltage level ${element.id} was removed from workspace`, {
          closeButton: true,
        });
      }
    } else {
      if (isSubstation(element)) {
        addSubstation(element);
        toast.success(`Substation ${element.id} was added to workspace`, {
          closeButton: true,
        });
      } else {
        addVoltageLevel(element);
        toast.success(`Voltage level ${element.id} was added to workspace`, {
          closeButton: true,
        });
      }
    }
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
