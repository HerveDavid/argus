import { Link } from '@/components/ui/link';
import { Project } from '../types/project.type';
import { paths } from '@/config/paths';
import { useProjectsStore } from '../stores/use-projects-store';
import { Card } from '@/components/ui/card';
import { MoreVertical, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ProjectItem = ({ name, color, path }: Project) => {
  const { setCurrentProject, removeProject } = useProjectsStore();

  const handleClick = () => {
    setCurrentProject({ name, color, path });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Empêche la navigation du Link parent
    removeProject(name);
  };

  return (
    <Link to={paths.gameMaster.home.getHref(name)} onClick={handleClick}>
      <Card className="flex items-center justify-between m-2 hover:bg-secondary group">
        <div className="flex items-center">
          <div
            className={`w-8 h-8 m-2 bg-primary rounded-sm flex items-center justify-center text-white`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1>{name}</h1>
            <h2 className="text-xs">{path}</h2>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 opacity-0 group-hover:opacity-100 focus:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    </Link>
  );
};

export default ProjectItem;
