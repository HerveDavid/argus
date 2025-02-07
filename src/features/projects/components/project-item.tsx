import { Link } from '@/components/ui/link';
import { Project } from '../types/project';
import { paths } from '@/config/paths';

const ProjectItem = ({ name, color, path }: Project) => {
  return (
    <Link to={paths.app.gameMaster.getHref(name)}>
      <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200">
        <div
          className={`w-8 h-8 ${color} rounded flex items-center justify-center text-white`}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-sm">{name}</div>
          <div className="text-xs text-gray-500">{path}</div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectItem;
