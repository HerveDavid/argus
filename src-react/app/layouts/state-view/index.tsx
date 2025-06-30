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

  const handleToolsPanelsResize = (sizes: number[]) => {
    if (isLeftToolsOpen && isRightToolsOpen) {
      if (sizes[0] !== undefined) {
        setLeftToolsSize(sizes[0]);
      }
      if (sizes[2] !== undefined) {
        setRightToolsSize(sizes[2]);
      }
    } else if (isLeftToolsOpen && !isRightToolsOpen) {
      if (sizes[0] !== undefined) {
        setLeftToolsSize(sizes[0]);
      }
    } else if (!isLeftToolsOpen && isRightToolsOpen) {
      if (sizes[0] !== undefined) {
        setRightToolsSize(sizes[0]);
      }
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

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0">
        <LeftSidebar />
        <ResizablePanelGroup
          className="flex flex-1 flex-col"
          direction="vertical"
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
          {(isLeftToolsOpen || isRightToolsOpen) && (
            <>
              <ResizableHandle className="z-20" />
              <ResizablePanel order={2} minSize={20}>
                <ResizablePanelGroup
                  className="flex flex-1 flex-col"
                  direction="horizontal"
                  onLayout={handleToolsPanelsResize}
                >
                  {isLeftToolsOpen && (
                    <ResizablePanel
                      id="left-tools"
                      className={isRightToolsOpen ? 'border-r' : ''}
                      order={1}
                      defaultSize={leftToolsSize}
                      minSize={15}
                      maxSize={85}
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
                      maxSize={85}
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
