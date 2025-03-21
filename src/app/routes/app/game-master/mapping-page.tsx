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
import Mapping from '@/features/mapping/components';
import { useProjectsStore } from '@/features/projects/stores/use-projects-store';
import { useEffect } from 'react';

const MappingPage = () => {
  const { currentProject, loadStoredProject } = useProjectsStore();

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
                    <Link
                      to={paths.gameMaster.home.getHref(currentProject!.name)}
                    >
                      {currentProject!.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>mapping</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        <main className="flex-1">
          <Mapping />
        </main>
      </div>
    </EditorLayout>
  );
};

export default MappingPage;
