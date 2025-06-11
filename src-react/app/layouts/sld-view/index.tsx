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
import { useWindowHeaderStore } from '@/stores/window-header.store';

import { RightSidebar, useRightSidebarStore } from './right-sidebar';

export interface SldViewProps {
  title: string;
}

export const SldView: React.FC<IDockviewPanelProps<SldViewProps>> = ({
  params,
}) => {
  const { title: id } = params;
  const {
    isOpen: isRightOpen,
    size: rightSize,
    setSize: setRightSize,
  } = useRightSidebarStore(id);
  const { setTitle } = useWindowHeaderStore();

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
      <header className={`shadow-sm border-b bg-sidebar`}>
        <Breadcrumb className="mx-2 py-2 text-sm">
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
            <div className="h-full p-2 bg-gradient-to-br from-background/10 to-foreground/7">
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
          <div className="flex-1 overflow-hidden p-2 bg-gradient-to-br from-background/10 to-foreground/7">
            <Sld id={id} />
          </div>
          <RightSidebar id={id} />
        </div>
      )}
    </div>
  );
};
