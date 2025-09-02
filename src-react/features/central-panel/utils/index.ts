import { DraggedItem } from '../types/dragged-item.type';

export { customTailwindTheme } from './dockview-theme';

export const isDraggedItem = (obj: any): obj is DraggedItem => {
  return obj && typeof obj === 'object' && typeof obj.id === 'string';
};
