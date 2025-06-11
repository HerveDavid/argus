import { DraggedItem } from '../types/dragged-item.type';

export const isDraggedItem = (obj: any): obj is DraggedItem => {
  return obj && typeof obj === 'object' && typeof obj.name === 'string';
};
