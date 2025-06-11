import { Minus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useRightSidebarStore } from '../../stores/state-view.store';

export const RightSidebarPanel = () => {
  const { activeItem, closePanel } = useRightSidebarStore();

  return (
    <div className="h-full bg-sidebar border-l overflow-auto">
      <div className="flex items-center justify-between border-b py-1 px-2 bg-background shadow">
        <h3 className="font-medium text-xs uppercase tracking-wide text-sidebar-foreground">
          {activeItem.label}
        </h3>
        <Button variant="ghost" className="size-1" onClick={closePanel}>
          <Minus />
        </Button>
      </div>
      <div className="p-4">{activeItem.content()}</div>
    </div>
  );
};
