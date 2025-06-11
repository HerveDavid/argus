import React from 'react';

import { useCentralPanelStore } from '@/stores/central-panel.store';
import { useWindowHeaderStore } from '@/stores/window-header.store';

interface DraggableItemProps {
  item: { name: string };
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item }) => {
  const { setTitle } = useWindowHeaderStore();
  const { addPanel } = useCentralPanelStore();

  const handleDragStart = (e: React.DragEvent<HTMLSpanElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.setData('text/plain', item.name);
    setTitle(item.name);
  };

  const handleClick = () => {
    const title = item.name;
    addPanel({
      id: title,
      tabComponent: 'default',
      component: 'sld',
      params: { title },
    });
    setTitle(title);
  };

  return (
    <span
      draggable={true}
      className="cursor-pointer text-xs text-muted-foreground block p-2 m-1 border border-border rounded hover:bg-sidebar-accent"
      onDragStart={handleDragStart}
      onClick={handleClick}
      tabIndex={1}
    >
      {item.name}
    </span>
  );
};

export default DraggableItem;
