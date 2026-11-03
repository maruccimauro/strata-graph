import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { accent } from "../theme";
import { GEO } from "../../core/layout";

export interface SectionData {
  label: string;
  hue: number;
  autoCount: number;
  autoTotal: number;
  manualCount: number;
  [key: string]: unknown;
}

/** The solid central node of a section (band label + counts). */
function SectionNodeImpl({ data }: NodeProps) {
  const d = data as SectionData;
  const col = accent(d.hue);
  return (
    <div
      style={{
        width: GEO.SECTION_W,
        height: GEO.SECTION_H,
        background: col,
        color: "#fff",
        borderRadius: 13,
        padding: "9px 12px",
        boxShadow: "0 2px 8px rgba(0,0,0,.18)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.1 }}>{d.label}</div>
      <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.9, marginTop: 3 }}>
        AUTO {d.autoCount}/{d.autoTotal}
        {d.manualCount > 0 ? ` · MANUAL +${d.manualCount}` : ""}
      </div>
      {/* source handle on the right: branches to this section's root docs */}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

export const SectionNode = memo(SectionNodeImpl);
