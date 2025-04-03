import React, { useState } from 'react';
import { TopMenuBar } from './top-menu-bar';
import {
  SidebarIconButton,
  SidebarItem,
} from './left-sidebar/sidebar-icon-button';
import { Folder, Layers, Waypoints } from 'lucide-react';
import { SidebarContent } from './left-sidebar/sidebar-content';

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
  // States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarItem, setActiveSidebarItem] = useState('explorer');

  // Handlers
  const handleSidebarItemClick = (itemId: string) => {
    if (activeSidebarItem === itemId) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setActiveSidebarItem(itemId);
      setSidebarOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopMenuBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full h-full">
          <div className="flex h-full">
            {/* Icon bar */}
            <div className="flex flex-col h-full text-secondary border-r gap-2">
              {sidebarItems.map((item) => (
                <SidebarIconButton
                  key={item.id}
                  item={item}
                  isActive={activeSidebarItem === item.id}
                  onClick={() => handleSidebarItemClick(item.id)}
                />
              ))}
            </div>

            {/* Sidebar content */}
            {sidebarOpen && (
              <div className="w-64 bg-gray-800 overflow-y-auto border-r">
                <SidebarContent activeItem={activeSidebarItem} />
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
      <TopMenuBar />
    </div>
  );
};

export default EditorLayout;
