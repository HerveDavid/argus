export interface OnItemDragObjectMove {
  eventType: "move";
  itemId: Id;
  time: number;
  newGroupOrder: number;
}

export interface OnItemDragObjectResize {
  eventType: "resize";
  itemId: Id;
  time: number;
  edge?: "left" | "right";
}