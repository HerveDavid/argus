import { Minus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useRightToolsStore } from '../../stores/state-view.store';

export const RightTools = () => {
  const { activeItem, closePanel } = useRightToolsStore();
  const ContentComponent = activeItem.content;

  return (
    <div className="flex flex-col bg-sidebar h-full">
      <div className="flex bg-background border-y justify-between shadow">
        <div className="font-medium text-xs uppercase tracking-wide text-sidebar-foreground ml-2">
          {activeItem.id}
        </div>

        <Button variant="ghost" className="size-0.5 px-1" onClick={closePanel}>
          <Minus />
        </Button>
      </div>

      <div className="p-4 h-full">
        <ContentComponent />
      </div>
    </div>
  );
};
