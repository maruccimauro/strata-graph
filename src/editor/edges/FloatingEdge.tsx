import { getBezierPath, useInternalNode, BaseEdge, type EdgeProps } from "@xyflow/react";
import { getEdgeParams } from "./floating";

/** Edge that attaches to the border of each node at the point nearest the other
 *  node, and follows the nodes as they move. Dependency edges also get a small
 *  dot at their origin (the prerequisite end) so the direction reads at a
 *  glance even where the arrowhead is hard to see. When the edge is selected or
 *  hovered it shows a ring at each real floating endpoint: an indicator of the
 *  retarget grab points, which act from the edge overlay (not a native drag). */
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
  const d = data as { originDot?: boolean; anchors?: boolean } | undefined;
  const stroke = (style?.stroke as string | undefined) ?? "var(--muted)";
  const opacity = (style?.opacity as number | undefined) ?? 1;
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {d?.originDot && <circle cx={sx} cy={sy} r={3.2} fill={stroke} opacity={opacity} />}
      {d?.anchors && (
        <g style={{ pointerEvents: "none" }}>
          <circle cx={sx} cy={sy} r={4.5} fill="var(--panel)" stroke={stroke} strokeWidth={1.6} />
          <circle cx={tx} cy={ty} r={4.5} fill="var(--panel)" stroke={stroke} strokeWidth={1.6} />
        </g>
      )}
    </>
  );
}
