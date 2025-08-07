import * as go from 'gojs';

// Custom BarLink class with proper TypeScript typing
export class BarLink extends go.Link {
  constructor(init?: Partial<go.Link>) {
    super();
    if (init) Object.assign(this, init);
  }

  public getLinkPoint(
    node: go.Node,
    port: go.GraphObject,
    _spot: go.Spot,
    _from: boolean,
    _ortho: boolean,
    _othernode: go.Node,
    otherport: go.GraphObject,
  ): go.Point {
    const r = port.getDocumentBounds();
    const op = otherport.getDocumentBounds();
    const below = op.centerY > r.centerY;
    const y = below ? r.bottom : r.top;

    if (node.category === 'Parallel' || node.category === 'Exclusive') {
      if (op.right < r.left) return new go.Point(r.left, y);
      if (op.left > r.right) return new go.Point(r.right, y);
      return new go.Point(
        (Math.max(r.left, op.left) + Math.min(r.right, op.right)) / 2,
        y,
      );
    } else {
      return new go.Point(r.centerX, y);
    }
  }

  public getLinkDirection(
    _node: go.Node,
    port: go.GraphObject,
    _linkpoint: go.Point,
    _spot: go.Spot,
    _from: boolean,
    _ortho: boolean,
    _othernode: go.Node,
    otherport: go.GraphObject,
  ): number {
    const p = port.getDocumentPoint(go.Spot.Center);
    const op = otherport.getDocumentPoint(go.Spot.Center);
    const below = op.y > p.y;
    return below ? 90 : 270;
  }
}
