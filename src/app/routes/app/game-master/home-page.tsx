import { EditorLayout } from '@/components/layouts/editor';
import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';
import { useProjectStore } from '@/features/projects/stores/use-current-project-store';
import { useEffect } from 'react';

const HomePage = () => {
  const { project, loadStoredProject } = useProjectStore();

  useEffect(() => {
    loadStoredProject();
  }, []);

  return (
    <EditorLayout>
      <div className="flex">
        {project!.name}
        <Link to={paths.gameMaster.mapping.getHref(project!.name)}>
          Mapping
        </Link>
      </div>
    </EditorLayout>
  );
};

export default HomePage;
