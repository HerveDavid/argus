import { IDockviewPanelProps } from 'dockview';
import React from 'react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useSelectedItemStore } from '@/stores/window-header.store';

import { SldBreadcrumb } from './components/sld-breadcrumb';
import { RightSidebar, useRightSidebarStore } from './right-sidebar';
import { SingleLineDiagram } from '@/features/diagram';
import { SldTools } from './components/sld-tools';

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
    <div className="flex h-full flex-col" onClick={handleSldClick}>
      <header className="bg-sidecar flex items-center justify-between border-b px-1">
        <SldTools id={id} />
      </header>
      {isRightOpen ? (
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={handleHorizontalPanelsResize}
          className="flex flex-1 overflow-hidden"
        >
          <ResizablePanel order={0} className="flex-1 overflow-hidden">
            <div className="from-background/10 to-foreground/7 h-full bg-gradient-to-br">
              <SingleLineDiagram elementId={id} />
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
          <div className="from-background/10 to-foreground/7 flex-1 overflow-hidden bg-gradient-to-br">
            <SingleLineDiagram elementId={id} />
          </div>
          <RightSidebar id={id} />
        </div>
      )}
      <footer className="bg-background flex h-5 items-center border-t px-2">
        <p className='text-xs text-muted-foreground'>powysbl v1.11.2</p>
      </footer>
    </div>
  );
};
