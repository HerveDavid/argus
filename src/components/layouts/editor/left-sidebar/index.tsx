import { useState } from 'react';
import { SidebarIconButton, SidebarItem } from './sidebar-icon-button';
import { SidebarContent } from './sidebar-content';
import { Settings } from 'lucide-react';

const LeftSideBar: React.FC<{ sidebarItems: SidebarItem[] }> = ({
  sidebarItems,
}) => {
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
    <div className="flex h-full">
      {/* Icon bar */}
      <div className="flex flex-col justify-between h-full text-secondary border-r gap-2">
        <div>
          {sidebarItems.map((item) => (
            <SidebarIconButton
              key={item.id}
              item={item}
              isActive={activeSidebarItem === item.id}
              onClick={() => handleSidebarItemClick(item.id)}
            />
          ))}
        </div>
        <button className="flex items-center justify-center size-8 w-full relative hover:text-foreground p-3 text-muted-foreground">
          <Settings size={18} />
        </button>
      </div>

      {/* Sidebar content */}
      {sidebarOpen && (
        <div className="w-64 bg-gray-800 overflow-y-auto border-r">
          <SidebarContent activeItem={activeSidebarItem} />
        </div>
      )}
    </div>
  );
};

export default LeftSideBar;
