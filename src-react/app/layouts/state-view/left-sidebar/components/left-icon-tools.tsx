import { leftSidebarTools } from '@/config/layouts';

import { useToolsStore } from '../../stores/state-view.store';

export const LeftIconTools = () => {
  const { activeItem, setActiveItem, isOpen, openPanel, closePanel } =
    useToolsStore();

  const handleIconPanelClick = (itemId: string) => {
    setActiveItem(itemId);
    openPanel();
  };

  return (
    <div className="space-y-3">
      {leftSidebarTools.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem.id === item.id;
        const handleClick = isOpen
          ? () => (isActive ? closePanel() : handleIconPanelClick(item.id))
          : () => handleIconPanelClick(item.id);
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
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r"></div>
            )}
            <Icon className="size-4" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};
