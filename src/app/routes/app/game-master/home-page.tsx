import { EditorLayout } from '@/components/layouts/editor';
import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';
import { ProjectSettings } from '@/features/projects/components/project-settings';
import { useProjectStore } from '@/features/projects/stores/use-current-project-store';
import { useEffect } from 'react';

const HomePage = () => {
  const { project, loadStoredProject } = useProjectStore();

  useEffect(() => {
    loadStoredProject();
  }, []);

  return (
    <EditorLayout>
      <div>
        <h1>{project!.name}</h1>

        <ProjectSettings />

        <Link to={paths.gameMaster.mapping.getHref(project!.name)}>
          Mapping
        </Link>
      </div>
    </EditorLayout>
  );
};

export default HomePage;
