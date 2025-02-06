import { Project } from '../types/project';

const ProjectItem: React.FC<Project> = ({ name, color, path }) => (
  <div className="flex items-center gap-3">
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
);

export default ProjectItem;
