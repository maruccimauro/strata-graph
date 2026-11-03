import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { INK, MUTED } from "../theme";

export interface CommentData {
  label: string; // title
  note?: string; // description
  ref?: string; // optional file/url reference
  locked?: boolean;
  [key: string]: unknown;
}

/** A user comment / flag. Visibly NOT a dependency node (sticky-note look). */
function CommentNodeImpl({ data, selected }: NodeProps) {
  const d = data as CommentData;
  return (
    <div
      style={{
        minWidth: 150,
        maxWidth: 220,
        background: "#fff7cc",
        color: "#4a3f12",
        border: `${selected ? 2.5 : 1.5}px solid ${selected ? "#caa83a" : "#e6cf72"}`,
        borderRadius: 8,
        padding: "8px 10px",
        boxShadow: "0 2px 8px rgba(120,100,0,.18)",
        fontSize: 11.5,
      }}
    >
      <div style={{ fontWeight: 700, display: "flex", gap: 5, alignItems: "baseline" }}>
        <span>🏷️</span>
        <span style={{ color: INK, filter: "none", flex: 1 }}>{d.label}</span>
        {d.locked && <span title="Locked (cannot move)" style={{ fontSize: 10 }}>🔒</span>}
      </div>
      {d.note && <div style={{ marginTop: 3, color: "#6a5c22" }}>{d.note}</div>}
      {d.ref && (
        <div style={{ marginTop: 4, fontSize: 10, color: MUTED, wordBreak: "break-all" }}>{d.ref}</div>
      )}
      {/* a single loose handle: comments attach to a node without dependency meaning */}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0.001, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0.001, width: 8, height: 8 }} />
    </div>
  );
}

export const CommentNode = memo(CommentNodeImpl);
