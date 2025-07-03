import { Minus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useRightSidebarStore } from '../../stores/state-view.store';

export const RightSidebarPanel = () => {
  const { activeItem, closePanel } = useRightSidebarStore();
  const ContentComponent = activeItem.content;

  return (
    <div className="h-full bg-sidebar border-l overflow-auto">
      <div className="flex items-center justify-between border-b py-1 px-2 bg-background shadow flex-shrink-0">
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
