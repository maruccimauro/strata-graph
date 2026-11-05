import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NodeStatus, Origin } from "../../core/types";
import { accent, docBg, GHOST, INK, MUTED, UP, DOWN } from "../theme";
import { GEO } from "../../core/layout";
import { t } from "../i18n";

export type Highlight = "sel" | "anc" | "desc" | undefined;

/** Relational-integrity alert on a node (N-44): it lost a dependency bridge when
 *  a neighbor was deleted. "orphan" = no dependency edges left; "partial" = it
 *  kept others. Drives a red pulse and a broken-link badge, composed over any
 *  selection highlight (a separate channel from `hl`). */
export type AlertMark = "orphan" | "partial" | undefined;

export interface DocData {
  label: string;
  hue: number;
  status: NodeStatus;
  origin: Origin;
  hl?: Highlight;
  alert?: AlertMark;
  /** click on the broken-link badge: ask to unlink this node from the alert. */
  onAlertBadge?: (nodeId: string) => void;
  locked?: boolean;
  dueAt?: number;
  [key: string]: unknown;
}

function subLabel(status: NodeStatus, origin: Origin): string {
  if (status === "missing") return "NOT GENERATED";
  if (status === "unavailable") return "UNAVAILABLE";
  return origin === "manual" ? "MANUAL" : "GENERATED";
}

/** Due-date urgency color: overdue (red), within 24h (amber), otherwise muted. */
export function dueColor(dueAt: number): string {
  const left = dueAt - Date.now();
  if (left < 0) return GHOST;
  if (left < 24 * 3600 * 1000) return "#d98324";
  return MUTED;
}

/** A document node: generated / not-generated (red dashed) / unavailable (crossed). */
function DocNodeImpl({ id, data, selected }: NodeProps) {
  const d = data as DocData;
  const missing = d.status === "missing";
  const unavailable = d.status === "unavailable";
  const hlColor = d.hl === "anc" ? UP : d.hl === "desc" ? DOWN : undefined;
  const emphasized = selected || d.hl === "sel";
  const border = hlColor ?? (missing ? GHOST : accent(d.hue));
  const bw = emphasized ? 3 : d.hl ? 2.4 : 1.6;
  const alerted = d.alert !== undefined;
  return (
    <div
      className={alerted ? `strata-alert strata-alert-${d.alert}` : undefined}
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
      {alerted && (
        <span
          role="button"
          title={`${d.alert === "orphan" ? t("alert.node.orphan") : t("alert.node.partial")} — ${t("alert.badge.clickUnlink")}`}
          onClick={(e) => { e.stopPropagation(); d.onAlertBadge?.(id); }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ position: "absolute", top: -10, left: -10, fontSize: 13, lineHeight: 1, cursor: "pointer", filter: "drop-shadow(0 1px 1px rgba(0,0,0,.4))" }}
        >
          ⛓️‍💥
        </span>
      )}
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
      {(d.locked || d.dueAt) && (
        <div style={{ position: "absolute", top: 4, right: 6, display: "flex", alignItems: "center", gap: 3, fontSize: 9 }}>
          {d.dueAt && (
            <span title="Due date" style={{ width: 7, height: 7, borderRadius: "50%", background: dueColor(d.dueAt), display: "inline-block" }} />
          )}
          {d.locked && <span title="Locked (cannot move)">🔒</span>}
        </div>
      )}
      {/* 8 connection points: side centers + corners. Loose mode lets any act
          as source or target; FloatingEdge still draws to the border. */}
      <Handle id="tl" type="source" position={Position.Top} style={{ left: "0%" }} />
      <Handle id="t" type="source" position={Position.Top} />
      <Handle id="tr" type="source" position={Position.Top} style={{ left: "100%" }} />
      <Handle id="r" type="source" position={Position.Right} />
      <Handle id="br" type="source" position={Position.Bottom} style={{ left: "100%" }} />
      <Handle id="b" type="source" position={Position.Bottom} />
      <Handle id="bl" type="source" position={Position.Bottom} style={{ left: "0%" }} />
      <Handle id="l" type="source" position={Position.Left} />
    </div>
  );
}

export const DocNode = memo(DocNodeImpl);
