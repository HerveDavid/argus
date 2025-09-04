import { Minus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useLeftSidebarStore } from '../../stores/state-view.store';

export const LeftSidebarPanel = () => {
  const { activeItem, closePanel, currentMode } = useLeftSidebarStore();

  if (!currentMode) {
    return (
      <div className="h-full bg-sidebar border-r flex items-center justify-center">
        <div className="text-center text-sidebar-foreground/60">
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!activeItem) {
    return null;
  }

  const ContentComponent = activeItem.content;

  return (
    <div className="h-full bg-sidebar border-r flex flex-col">
      <div className="flex items-center justify-between border-b py-1 px-2 bg-background flex-shrink-0">
        <h3 className="font-medium text-xs uppercase tracking-wide text-sidebar-foreground">
          {activeItem.label}
        </h3>
        <Button
          variant="ghost"
          className="size-1"
          onClick={closePanel}
          title="Close"
        >
          <Minus />
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <ContentComponent />
      </div>
    </div>
  );
};
