import { getBezierPath, useInternalNode, BaseEdge, type EdgeProps } from "@xyflow/react";
import { getEdgeParams } from "./floating";

/** Edge that attaches to the border of each node at the point nearest the other
 *  node, and follows the nodes as they move. Dependency edges also get a small
 *  dot at their origin (the prerequisite end) so the direction reads at a
 *  glance even where the arrowhead is hard to see. */
export function FloatingEdge({ id, source, target, markerEnd, style, data }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);
  const [path] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });
  const originDot = (data as { originDot?: boolean } | undefined)?.originDot;
  const stroke = (style?.stroke as string | undefined) ?? "var(--muted)";
  const opacity = (style?.opacity as number | undefined) ?? 1;
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {originDot && <circle cx={sx} cy={sy} r={3.2} fill={stroke} opacity={opacity} />}
    </>
  );
}
