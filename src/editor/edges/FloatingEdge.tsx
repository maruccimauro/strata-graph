import type { MouseEvent as ReactMouseEvent } from "react";
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
  const d = data as
    | {
        originDot?: boolean;
        anchors?: boolean;
        onAnchorGrab?: (id: string, source: string, target: string, end: "source" | "target", x: number, y: number) => void;
      }
    | undefined;
  const stroke = (style?.stroke as string | undefined) ?? "var(--muted)";
  const opacity = (style?.opacity as number | undefined) ?? 1;

  // Pull each anchor back along the edge so the ring does not cover the origin
  // dot or the arrowhead, keeping the direction readable. Clicking an anchor
  // starts a retarget of that end (the line then follows the cursor).
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;
  const off = Math.max(0, Math.min(13, len / 2 - 2));
  const ux = dx / len;
  const uy = dy / len;
  const grab = (end: "source" | "target", e: ReactMouseEvent) => {
    e.stopPropagation();
    d?.onAnchorGrab?.(id, source, target, end, e.clientX, e.clientY);
  };
  const anchorProps = (end: "source" | "target") => ({
    r: 4.5,
    fill: "var(--panel)",
    stroke,
    strokeWidth: 1.6,
    style: { cursor: "pointer" as const },
    onClick: (e: ReactMouseEvent) => grab(end, e),
    onPointerDown: (e: ReactMouseEvent) => e.stopPropagation(),
  });
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {d?.originDot && <circle cx={sx} cy={sy} r={3.2} fill={stroke} opacity={opacity} />}
      {d?.anchors && (
        <g>
          <circle cx={sx + ux * off} cy={sy + uy * off} {...anchorProps("source")} />
          <circle cx={tx - ux * off} cy={ty - uy * off} {...anchorProps("target")} />
        </g>
      )}
    </>
  );
}
