import { Position, type InternalNode, type Node } from "@xyflow/react";

/** Point where the line from a node's center toward an arbitrary point (ox, oy)
 *  crosses the node's border (adapted from the React Flow "floating edges"
 *  example). Used both for edge endpoints (toward the other node's center) and
 *  for the retarget rubber-band (toward the cursor). */
export function borderPointToward(node: InternalNode<Node>, ox: number, oy: number) {
  const w = (node.measured.width ?? 0) / 2;
  const h = (node.measured.height ?? 0) / 2;
  const cx = node.internals.positionAbsolute.x + w;
  const cy = node.internals.positionAbsolute.y + h;

  const xx1 = (ox - cx) / (2 * (w || 1)) - (oy - cy) / (2 * (h || 1));
  const yy1 = (ox - cx) / (2 * (w || 1)) + (oy - cy) / (2 * (h || 1));
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  return { x: w * (xx3 + yy3) + cx, y: h * (-xx3 + yy3) + cy };
}

/** Border point of `node` on the line toward the center of `other`. */
function intersection(node: InternalNode<Node>, other: InternalNode<Node>) {
  const ox = other.internals.positionAbsolute.x + (other.measured.width ?? 0) / 2;
  const oy = other.internals.positionAbsolute.y + (other.measured.height ?? 0) / 2;
  return borderPointToward(node, ox, oy);
}

function sideOf(node: InternalNode<Node>, p: { x: number; y: number }): Position {
  const nx = Math.round(node.internals.positionAbsolute.x);
  const ny = Math.round(node.internals.positionAbsolute.y);
  const px = Math.round(p.x);
  const py = Math.round(p.y);
  if (px <= nx + 1) return Position.Left;
  if (px >= nx + (node.measured.width ?? 0) - 1) return Position.Right;
  if (py <= ny + 1) return Position.Top;
  return Position.Bottom;
}

export function getEdgeParams(source: InternalNode<Node>, target: InternalNode<Node>) {
  const sp = intersection(source, target);
  const tp = intersection(target, source);
  return { sx: sp.x, sy: sp.y, tx: tp.x, ty: tp.y, sourcePos: sideOf(source, sp), targetPos: sideOf(target, tp) };
}
