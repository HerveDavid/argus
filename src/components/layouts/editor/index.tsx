import React, { useState } from 'react';
import { TopMenuBar } from './top-menu-bar';
import { SidebarItem } from './left-sidebar/sidebar-icon-button';
import {
  Folder,
  Layers,
  Waypoints,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import BottomMenuBar from './bottom-menu-bar';
import LeftSideBar from './left-sidebar';
import { Toaster } from '@/components/ui/sonner';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';

type LayoutProps = {
  children: React.ReactNode;
};

// Configuration
const sidebarItems: SidebarItem[] = [
  { id: 'explorer', icon: <Waypoints size={18} />, label: 'Explorer' },
  { id: 'workspace', icon: <Folder size={18} />, label: 'Workspace' },
  { id: 'layers', icon: <Layers size={18} />, label: 'Layers' },
];

export const EditorLayout = ({ children }: LayoutProps) => {
  // État pour contrôler la visibilité du panneau inférieur
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  // Fonction pour basculer la visibilité du panneau
  const togglePanel = () => {
    setIsPanelVisible(!isPanelVisible);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopMenuBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full h-full">
          <LeftSideBar sidebarItems={sidebarItems} />
          <div className="flex-1 overflow-hidden flex flex-col">
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel
                defaultSize={isPanelVisible ? 75 : 100}
                minSize={30}
              >
                <div className="h-full w-full">{children}</div>
              </ResizablePanel>

              {isPanelVisible && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={25} minSize={2}>
                    <div className="p-4">Two</div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>

            <button
              onClick={togglePanel}
              className="bg-gray-200 hover:bg-accent-foreground text-gray-700 flex items-center justify-center py-1 w-full border-t"
            >
              {isPanelVisible ? (
                <>
                  <ChevronDown size={16} className="mr-1" />
                  <span>Log</span>
                </>
              ) : (
                <>
                  <ChevronUp size={16} className="mr-1" />
                  <span>Log</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <Toaster />
      <BottomMenuBar />
    </div>
  );
};

export default EditorLayout;
