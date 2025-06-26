import React from 'react';
import { useCentralPanelStore } from '@/stores/central-panel.store';
import { useWindowHeaderStore } from '@/stores/window-header.store';
import { Substation } from '@/types/substation';
import { useDoubleClick } from '@/hooks/use-double-click';

interface DraggableItemProps {
  substation: Substation;
  children: React.ReactNode;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
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

  const handleDoubleClickAction = () => {
    const title = substation.id;
    addPanel({
      id: title,
      tabComponent: 'default',
      component: 'sld',
      params: { substation },
    });
    setTitle(title);
  };

  const { onClick, onDoubleClick } = useDoubleClick({
    onDoubleClick: handleDoubleClickAction,
  });

  return (
    <span
      draggable={true}
      className="cursor-pointer"
      onDragStart={handleDragStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      tabIndex={1}
    >
      {children}
    </span>
  );
};
