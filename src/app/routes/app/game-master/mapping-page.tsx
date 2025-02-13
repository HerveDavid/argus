import { EditorLayout } from '@/components/layouts/editor';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';
import Editor from '@/features/game-master/components/editor';
import { useProjectStore } from '@/features/projects/stores/use-current-project-store';
import { useEffect } from 'react';

const MappingPage = () => {
  const { project, loadStoredProject } = useProjectStore();

  useEffect(() => {
    loadStoredProject();
  }, []);

  return (
    <EditorLayout>
      <div className="flex flex-col flex-1">
        <div className="border-b">
          <div className="flex items-center gap-2 px-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink>
                    <Link to={paths.gameMaster.home.getHref(project!.name)}>
                      {project!.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Mapping</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        <main className="flex-1">
          <Editor />
        </main>
      </div>
    </EditorLayout>
  );
};

export default MappingPage;
