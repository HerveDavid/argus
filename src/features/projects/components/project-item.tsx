import { Link } from '@/components/ui/link';
import { Project } from '../types/project';
import { paths } from '@/config/paths';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const ProjectItem: React.FC<Project> = ({ name, color, path }) => (
  <Link to={paths.app.gameMaster.getHref(name)}>
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{path}</CardDescription>
      </CardHeader>
    </Card>
  </Link>
);

export default ProjectItem;
