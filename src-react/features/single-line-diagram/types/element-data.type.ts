export interface ElementData {
  id: string;
  type:
    | 'breaker'
    | 'disconnector'
    | 'wire'
    | 'feeder'
    | 'busbar'
    | 'node'
    | 'other';
  element: Element;
  transform?: string;
  fill?: string;
  stroke?: string;
  className?: string;
  d?: string; // paths
  equipmentId?: string;
  isOpen?: boolean;
  direction?: string;
  powerActive?: number;
  powerReactive?: number;
  priority: number; // animation priority
}
