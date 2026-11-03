import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NodeStatus, Origin } from "../../core/types";
import { accent, docBg, GHOST, INK, MUTED, UP, DOWN } from "../theme";
import { GEO } from "../../core/layout";

export type Highlight = "sel" | "anc" | "desc" | undefined;

export interface DocData {
  label: string;
  hue: number;
  status: NodeStatus;
  origin: Origin;
  hl?: Highlight;
  [key: string]: unknown;
}

function subLabel(status: NodeStatus, origin: Origin): string {
  if (status === "missing") return "NOT GENERATED";
  if (status === "unavailable") return "UNAVAILABLE";
  return origin === "manual" ? "MANUAL" : "GENERATED";
}

/** A document node: generated / not-generated (red dashed) / unavailable (crossed). */
function DocNodeImpl({ data, selected }: NodeProps) {
  const d = data as DocData;
  const missing = d.status === "missing";
  const unavailable = d.status === "unavailable";
  const hlColor = d.hl === "anc" ? UP : d.hl === "desc" ? DOWN : undefined;
  const emphasized = selected || d.hl === "sel";
  const border = hlColor ?? (missing ? GHOST : accent(d.hue));
  const bw = emphasized ? 3 : d.hl ? 2.4 : 1.6;
  return (
    <div
      style={{
        width: GEO.DOC_W,
        height: GEO.DOC_H,
        background: missing ? "transparent" : docBg(d.hue),
        border: `${bw}px ${missing || d.origin === "manual" ? "dashed" : "solid"} ${emphasized ? accent(d.hue) : border}`,
        borderRadius: 9,
        padding: "8px 11px",
        opacity: unavailable ? 0.55 : 1,
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: missing ? MUTED : INK,
          textDecoration: unavailable ? "line-through" : "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {d.label}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.03em", color: missing ? GHOST : MUTED, marginTop: 4 }}>
        {subLabel(d.status, d.origin)}
      </div>
      {/* multi-side connection points (loose mode lets any act as source or target) */}
      <Handle id="t" type="source" position={Position.Top} />
      <Handle id="r" type="source" position={Position.Right} />
      <Handle id="b" type="source" position={Position.Bottom} />
      <Handle id="l" type="source" position={Position.Left} />
    </div>
  );
}

export const DocNode = memo(DocNodeImpl);
