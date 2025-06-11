import { rightSidebarPanels } from '@/config/layouts';

import { useRightSidebarStore } from '../../stores/state-view.store';

export const RightSidebar = () => {
  const { activeItem, setActiveItem, isOpen, openPanel, closePanel } =
    useRightSidebarStore();

  const handleIconClick = (itemId: string) => {
    setActiveItem(itemId);
    openPanel();
  };

  return (
    <div className="flex">
      <div className="w-8 border-l flex flex-col items-center py-2 space-y-3">
        {rightSidebarPanels.map((item) => {
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
                isActive ? 'bg-background' : 'text-sidebar-foreground'
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
    </div>
  );
};
