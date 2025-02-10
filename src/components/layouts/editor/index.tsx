import { TopMenuBar } from '@/features/top-menu-bar';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { useProjectStore } from '@/features/projects/stores/use-current-project-store';
import { useEffect } from 'react';
import { LeftPanel } from './left-panel';

type LayoutProps = {
  children: React.ReactNode;
};

export const EditorLayout = ({ children }: LayoutProps) => {
  const { project, loadStoredProject } = useProjectStore();

  useEffect(() => {
    loadStoredProject();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <TopMenuBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <LeftPanel />

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          <div className="border-b">
            <div className="flex items-center gap-2 px-1">
              <Separator orientation="vertical" className="h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink>{project?.name}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Mapping</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
