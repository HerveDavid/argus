import { rightSidebarSlds } from '@/config/layouts';

import { useRightSidebarStore } from '../hooks/use-right-sidebar-store';

import { RightSidebarPanel } from './right-sidebar-panel';

export const RightSidebar = ({ id }: { id: string }) => {
  const { activeItem, setActiveItem, isOpen, openPanel, closePanel } =
    useRightSidebarStore(id);

  const handleIconClick = (itemId: string) => {
    setActiveItem(itemId);
    openPanel();
  };

  return (
    <div className={`flex ${isOpen ? 'w-full' : ''}`}>
      <div className="w-8 flex flex-col items-center pt-1 space-y-3">
        {rightSidebarSlds.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem.id === item.id;
          const handleClick = isOpen
            ? () => (isActive ? closePanel() : handleIconClick(item.id))
            : () => handleIconClick(item.id);
          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`size-5 flex items-center justify-center rounded-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group relative ${
                isActive ? 'bg-sidebar' : 'text-sidebar-foreground'
              }`}
              title={item.label}
            >
              {isActive && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-l"></div>
              )}
              <Icon className="size-4" />
              <div className="absolute right-full mr-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
      {isOpen && <RightSidebarPanel id={id} />}
    </div>
  );
};
