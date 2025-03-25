import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock } from './clock';
import FileDropdown from './file-dropdown';
import ViewDropdown from './view-dropdown';

export const TopMenuBar = () => {
  return (
    <div className="flex items-center justify-between p-1 border-b shadow">
      <div className="flex space-x-4">
        <FileDropdown />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-sm text-foreground hover:text-foreground-hover">
              Edit
            </button>
          </DropdownMenuTrigger>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-sm text-foreground hover:text-foreground-hover">
              Create
            </button>
          </DropdownMenuTrigger>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-sm text-foreground hover:text-foreground-hover">
              Options
            </button>
          </DropdownMenuTrigger>
        </DropdownMenu>
        <ViewDropdown />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-sm text-foreground hover:text-foreground-hover">
              Help
            </button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </div>
      <Clock />
    </div>
  );
};
