import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { accent } from "../theme";
import { GEO } from "../../core/layout";
import { dueColor } from "./DocNode";
import { t } from "../i18n";

export interface SectionData {
  label: string;
  hue: number;
  autoCount: number;
  autoTotal: number;
  manualCount: number;
  locked?: boolean;
  dueAt?: number;
  [key: string]: unknown;
}

/** The solid central node of a section: the band's representative. It is pinned
 *  (never dragged, never selected) and a click opens the band panel. Shows the
 *  band label, counts and the same status indicators as documents (N-36). */
function SectionNodeImpl({ data }: NodeProps) {
  const d = data as SectionData;
  const col = accent(d.hue);
  return (
    <div
      title={t("band.central.tip")}
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
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.1 }}>{d.label}</div>
      <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.9, marginTop: 3 }}>
        AUTO {d.autoCount}/{d.autoTotal}
        {d.manualCount > 0 ? ` · MANUAL +${d.manualCount}` : ""}
      </div>
      {(d.locked || d.dueAt) && (
        <div style={{ position: "absolute", top: 5, right: 7, display: "flex", alignItems: "center", gap: 3, fontSize: 9 }}>
          {d.dueAt && (
            <span title={t("node.due.tip")} style={{ width: 7, height: 7, borderRadius: "50%", background: dueColor(d.dueAt), display: "inline-block" }} />
          )}
          {d.locked && <span title={t("node.locked.tip")}>🔒</span>}
        </div>
      )}
      {/* source handle on the right: branches to this section's root docs */}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

export const SectionNode = memo(SectionNodeImpl);
