import { Link } from '@/components/ui/link';
import { Project } from '../types/project.type';
import { paths } from '@/config/paths';
import { useProjectStore } from '../stores/use-current-project-store';
import { Card } from '@/components/ui/card';

const ProjectItem = ({ name, color, path }: Project) => {
  const { setProject } = useProjectStore();

  const handleClick = () => {
    setProject({ name, color, path });
  };

  return (
    <Link to={paths.app.gameMaster.getHref(name)} onClick={handleClick}>
      <Card className="flex items-center m-2 hover:bg-secondary">
        <div
          className={`w-8 h-8 m-2 bg-primary rounded-sm flex items-center justify-center text-white`}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1>{name}</h1>
          <h2 className="text-xs">{path}</h2>
        </div>
      </Card>
    </Link>
  );
};

export default ProjectItem;
