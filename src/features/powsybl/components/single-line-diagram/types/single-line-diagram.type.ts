export interface SingleLineDiagramProps {
  lineId: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetElement: SVGElement | null;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  targetElement: SVGElement | null;
  onClose: () => void;
  onToggleBreaker: (breakerId: string, isClosed: boolean) => void;
}

export interface LegendOverlayProps {
  className?: string;
}
