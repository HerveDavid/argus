import { Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLeftSidebarStore } from '../../stores/state-view.store';

export const LeftSidebarPanel = () => {
  const { activeItem, closePanel } = useLeftSidebarStore();
  const ContentComponent = activeItem.content;
  
  return (
    <div className="h-full bg-sidebar border-r flex flex-col">
      {/* Header fixe */}
      <div className="flex items-center justify-between border-b py-1 px-2 bg-background shadow flex-shrink-0">
        <h3 className="font-medium text-xs uppercase tracking-wide text-sidebar-foreground">
          {activeItem.label}
        </h3>
        <Button variant="ghost" className="size-1" onClick={closePanel}>
          <Minus />
        </Button>
      </div>
      
      {/* Contenu avec scroll */}
      <div className="flex-1 overflow-auto p-2">
        <ContentComponent />
      </div>
    </div>
  );
};