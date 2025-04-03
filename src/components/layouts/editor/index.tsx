import React from 'react';
import { TopMenuBar } from './top-menu-bar';
import { SidebarItem } from './left-sidebar/sidebar-icon-button';
import { Folder, Layers, Waypoints } from 'lucide-react';
import BottomMenuBar from './bottom-menu-bar';
import LeftSideBar from './left-sidebar';

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
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopMenuBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full h-full">
          <LeftSideBar sidebarItems={sidebarItems} />
          {children}
        </div>
      </div>
      <BottomMenuBar />
    </div>
  );
};

export default EditorLayout;
