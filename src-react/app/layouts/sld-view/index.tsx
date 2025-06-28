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

  const handleHorizontalPanelsResize = (sizes: number[]) => {
    if (sizes[1] !== undefined) {
      setRightSize(sizes[1]);
    }
  };

  const handleSldClick = () => {
    setTitle(`${id}`);
  };

  return (
    <div className="flex flex-col h-full" onClick={handleSldClick}>
      <header className="border-b bg-sidebar h-5 flex items-center">
        <Breadcrumb className="mx-2 text-xs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Components</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
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