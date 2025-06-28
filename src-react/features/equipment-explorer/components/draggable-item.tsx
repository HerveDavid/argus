import React from 'react';
import { useCentralPanelStore } from '@/stores/central-panel.store';
import { useSelectedItemStore } from '@/stores/window-header.store';
import { useDoubleClick } from '@/hooks/use-double-click';

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  children,
}) => {
  const { setTitle } = useSelectedItemStore();
  const { addPanel } = useCentralPanelStore();

  const handleDragStart = (e: React.DragEvent<HTMLSpanElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(id));
    e.dataTransfer.setData('text/plain', id);
    setTitle(id);
  };

  const handleDoubleClickAction = () => {
    const title = id;
    addPanel({
      id,
      tabComponent: 'default',
      component: 'sld',
      params: { id },
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
