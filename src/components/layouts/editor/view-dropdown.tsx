import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';

const ViewDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-sm text-foreground hover:text-foreground-hover transition-colors duration-200">
          View
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link to={paths.home.path}>State View</Link>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Game Master
          </DropdownMenuItem>
          <DropdownMenuItem>
            KPI
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ViewDropdown;
