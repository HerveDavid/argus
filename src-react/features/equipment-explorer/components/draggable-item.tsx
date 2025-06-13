import React from 'react';

import { useCentralPanelStore } from '@/stores/central-panel.store';
import { useWindowHeaderStore } from '@/stores/window-header.store';
import { Substation } from '@/types/substation';

interface DraggableItemProps {
  substation: Substation;
  children: React.ReactNode;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  substation,
  children,
}) => {
  const { setTitle } = useWindowHeaderStore();
  const { addPanel } = useCentralPanelStore();

  const handleDragStart = (e: React.DragEvent<HTMLSpanElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(substation));
    e.dataTransfer.setData('text/plain', substation.id);
    setTitle(substation.id);
  };

  const handleClick = () => {
    const title = substation.id;
    addPanel({
      id: title,
      tabComponent: 'default',
      component: 'sld',
      params: { substation },
    });
    setTitle(title);
  };

  return (
    <span
      draggable={true}
      className="cursor-pointer"
      onDragStart={handleDragStart}
      onClick={handleClick}
      tabIndex={1}
    >
      {children}
    </span>
  );
};

export default DraggableItem;
