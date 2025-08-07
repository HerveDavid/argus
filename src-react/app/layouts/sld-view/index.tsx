import { IDockviewPanelProps } from 'dockview';
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Sld } from '@/features/single-line-diagram';
import { useSelectedItemStore } from '@/stores/window-header.store';
import { RightSidebar, useRightSidebarStore } from './right-sidebar';
import { useBreadcrumb } from './hooks/use-breadcrumb';

export interface SldViewProps {
  id: string;
}

export const SldView: React.FC<IDockviewPanelProps<SldViewProps>> = ({
                                                                       params: { id },
                                                                     }) => {
  const {
    isOpen: isRightOpen,
    size: rightSize,
    setSize: setRightSize,
  } = useRightSidebarStore(id);
  const { setTitle } = useSelectedItemStore();

  // Utilisation du hook breadcrumb
  const { data: breadcrumb, isLoading: isLoadingBreadcrumb } = useBreadcrumb(id);

  const handleHorizontalPanelsResize = (sizes: number[]) => {
    if (sizes[1] !== undefined) {
      setRightSize(sizes[1]);
    }
  };

  const handleSldClick = () => {
    setTitle(`${id}`);
  };

  // Rendu du breadcrumb
  const renderBreadcrumb = () => {
    if (isLoadingBreadcrumb) {
      return (
        <BreadcrumbList>
          <BreadcrumbItem>
            <div className="h-3 w-16 bg-gray-300 animate-pulse rounded" />
          </BreadcrumbItem>
        </BreadcrumbList>
      );
    }

    if (!breadcrumb || breadcrumb.items.length === 0) {
      return (
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
    }

    return (
      <BreadcrumbList>
        {breadcrumb.items.map((item, index) => (
          <React.Fragment key={`${item.type}-${item.id}`}>
            <BreadcrumbItem>
              {index === breadcrumb.items.length - 1 ? (
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  onClick={() => {
                    // Optionnel: navigation vers l'élément parent
                    if (item.type === 'substation' || item.type === 'voltage_level') {
                      // Logique de navigation si nécessaire
                      console.log(`Navigate to ${item.type}: ${item.id}`);
                    }
                  }}
                  className="cursor-pointer hover:text-primary"
                >
                  {item.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumb.items.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    );
  };

  return (
    <div className="flex flex-col h-full" onClick={handleSldClick}>
      <header className="border-b bg-sidebar h-5 flex items-center">
        <Breadcrumb className="mx-2 text-xs">
          {renderBreadcrumb()}
        </Breadcrumb>
      </header>
      {isRightOpen ? (
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={handleHorizontalPanelsResize}
          className="flex flex-1 overflow-hidden"
        >
          <ResizablePanel order={0} className="flex-1 overflow-hidden">
            <div className="h-full bg-gradient-to-br from-background/10 to-foreground/7">
              <Sld id={id} />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle={true} />
          <ResizablePanel
            order={1}
            defaultSize={rightSize}
            minSize={20}
            className="flex"
          >
            <RightSidebar id={id} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden bg-gradient-to-br from-background/10 to-foreground/7">
            <Sld id={id} />
          </div>
          <RightSidebar id={id} />
        </div>
      )}
    </div>
  );
};
