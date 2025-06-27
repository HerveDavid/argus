import React, { useEffect } from 'react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

import { Footer } from './footer';
import { Header } from './header';
import { LeftSidebar, LeftSidebarPanel } from './left-sidebar';
import { RightSidebar, RightSidebarPanel } from './right-sidebar';
import {
  useToolsStore,
  useLeftSidebarStore,
  useRightSidebarStore,
  useLeftToolsStore,
  useRightToolsStore,
} from './stores/state-view.store';
import { LeftTools } from './left-tools';
import { RightTools } from './right-tools';

export const StateView: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    isOpen: isLeftOpen,
    size: leftSize,
    setSize: setLeftSize,
  } = useLeftSidebarStore();
  const {
    isOpen: isLeftToolsOpen,
    size: leftToolsSize,
    setSize: setLeftToolsSize,
  } = useLeftToolsStore();

  const {
    isOpen: isRightOpen,
    size: rightSize,
    setSize: setRightSize,
  } = useRightSidebarStore();
  const {
    isOpen: isRightToolsOpen,
    size: rightToolsSize,
    setSize: setRightToolsSize,
  } = useRightToolsStore();

  const {
    isOpen: isToolsOpen,
    size: toolsSize,
    setSize: setToolsSize,
  } = useToolsStore();

  const handleHorizontalPanelsResize = (sizes: number[]) => {
    let leftIndex = -1;
    let rightIndex = -1;
    if (isLeftOpen && isRightOpen) {
      leftIndex = 0;
      rightIndex = 2;
    } else if (isLeftOpen) {
      leftIndex = 0;
    } else if (isRightOpen) {
      rightIndex = 1;
    }
    if (leftIndex !== -1 && sizes[leftIndex] !== undefined) {
      setLeftSize(sizes[leftIndex]);
    }
    if (rightIndex !== -1 && sizes[rightIndex] !== undefined) {
      setRightSize(sizes[rightIndex]);
    }
  };

  const handleHorizontalToolsPanelsResize = (sizes: number[]) => {
    let leftToolsIndex = -1;
    let rightToolsIndex = -1;

    if (isLeftToolsOpen && isRightToolsOpen) {
      leftToolsIndex = 0;
      rightToolsIndex = 2;
    } else if (isLeftToolsOpen) {
      leftToolsIndex = 0;
    } else if (isRightToolsOpen) {
      rightToolsIndex = isLeftToolsOpen ? 2 : 0;
    }

    if (leftToolsIndex !== -1 && sizes[leftToolsIndex] !== undefined) {
      setLeftToolsSize(sizes[leftToolsIndex]);
    }
    if (rightToolsIndex !== -1 && sizes[rightToolsIndex] !== undefined) {
      setRightToolsSize(sizes[rightToolsIndex]);
    }
  };

  const handleVerticalPanelsResize = (sizes: number[]) => {
    if (isToolsOpen && sizes.length >= 2) {
      setToolsSize(sizes[1]);
    }
  };

  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const resizeObserver = new ResizeObserver((_entries) => {
      window.dispatchEvent(new Event('resize'));
    });
    resizeObserver.observe(contentRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculer si au moins un des tools panels est ouvert
  const hasToolsOpen = isLeftToolsOpen || isRightToolsOpen;

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0">
        <LeftSidebar />
        <ResizablePanelGroup
          className="flex flex-1 flex-col"
          direction="vertical"
          onLayout={handleVerticalPanelsResize}
        >
          <ResizablePanel order={1} className="flex flex-1">
            <ResizablePanelGroup
              direction="horizontal"
              onLayout={handleHorizontalPanelsResize}
            >
              {isLeftOpen && (
                <>
                  <ResizablePanel
                    id="left-sidebar"
                    order={1}
                    defaultSize={leftSize}
                    minSize={15}
                    maxSize={50}
                  >
                    <LeftSidebarPanel />
                  </ResizablePanel>
                  <ResizableHandle className="z-20" />
                </>
              )}
              <ResizablePanel id="main-content" order={2} minSize={30}>
                <div ref={contentRef} className="h-full">
                  {children}
                </div>
              </ResizablePanel>
              {isRightOpen && (
                <>
                  <ResizableHandle className="z-20" />
                  <ResizablePanel
                    id="right-sidebar"
                    order={3}
                    defaultSize={rightSize}
                    minSize={15}
                    maxSize={50}
                  >
                    <RightSidebarPanel />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
          {hasToolsOpen && (
            <>
              <ResizableHandle className="z-20" />
              <ResizablePanel order={2} defaultSize={toolsSize} minSize={20}>
                <ResizablePanelGroup
                  className="flex flex-1 flex-row"
                  direction="horizontal"
                  onLayout={handleHorizontalToolsPanelsResize}
                >
                  {isLeftToolsOpen && (
                    <ResizablePanel
                      id="left-tools"
                      order={1}
                      defaultSize={leftToolsSize}
                      minSize={15}
                      maxSize={isRightToolsOpen ? 85 : 100}
                    >
                      <LeftTools />
                    </ResizablePanel>
                  )}
                  {isLeftToolsOpen && isRightToolsOpen && (
                    <ResizableHandle className="z-20" />
                  )}
                  {isRightToolsOpen && (
                    <ResizablePanel
                      id="right-tools"
                      order={isLeftToolsOpen ? 3 : 1}
                      defaultSize={rightToolsSize}
                      minSize={15}
                      maxSize={isLeftToolsOpen ? 85 : 100}
                    >
                      <RightTools />
                    </ResizablePanel>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
        <RightSidebar />
      </div>
      <Footer />
    </div>
  );
};
