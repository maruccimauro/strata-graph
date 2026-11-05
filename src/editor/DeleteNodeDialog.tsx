import { useMemo, useState } from "react";
import { Panel, Button } from "./ui/primitives";
import { MUTED } from "./theme";
import { t } from "./i18n";
import { severityChip, severityKey } from "./alertStyle";
import type { GraphNode } from "../core/types";
import type { BreakAnalysis } from "./integrity";

const SEP = "\u0000";
const pairKey = (p: { source: string; target: string }): string => `${p.source}${SEP}${p.target}`;

export interface DeleteNodeDialogProps {
  node: GraphNode;
  analysis: BreakAnalysis;
  labelOf: (id: string) => string;
  onConfirm: (acceptedKeys: Set<string>) => void;
  onCancel: () => void;
}

/** Read-only chip row summarizing one side of the broken links. */
function NeighborList({ title, ids, labelOf }: { title: string; ids: string[]; labelOf: (id: string) => string }) {
  if (ids.length === 0) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".05em", color: MUTED, marginBottom: 3 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {ids.map((id) => (
          <span key={id} style={{ fontSize: ".72rem", padding: "1px 7px", borderRadius: 5, background: "color-mix(in srgb, var(--muted) 14%, transparent)", whiteSpace: "nowrap" }}>
            {labelOf(id)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Confirmation shown when deleting a node whose removal breaks dependency links
 *  (N-44). It first shows the two sides that lose a link (what the node depends
 *  on, and what requires it), then offers to rebuild each prerequisite to
 *  dependent bridge, grouped by prerequisite with a filter and select all, and
 *  previews the neighbors left under a broken-link alert. */
export function DeleteNodeDialog({ node, analysis, labelOf, onConfirm, onCancel }: DeleteNodeDialogProps) {
  // Default: rebuild every bridge (preserving the chain is the common intent and
  // every step is undoable); the user unchecks the ones they do not want.
  const [accepted, setAccepted] = useState<Set<string>>(() => new Set(analysis.pairs.map(pairKey)));
  const [filter, setFilter] = useState("");

  // Bridges grouped by prerequisite, each row filtered by the dependent's label.
  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const byPrereq = new Map<string, { source: string; target: string }[]>();
    for (const p of analysis.pairs) {
      if (q && !labelOf(p.target).toLowerCase().includes(q) && !labelOf(p.source).toLowerCase().includes(q)) continue;
      const arr = byPrereq.get(p.source);
      if (arr) arr.push(p);
      else byPrereq.set(p.source, [p]);
    }
    return [...byPrereq.entries()];
  }, [analysis.pairs, filter, labelOf]);

  const visibleKeys = useMemo(() => groups.flatMap(([, ps]) => ps.map(pairKey)), [groups]);

  const toggle = (k: string) =>
    setAccepted((cur) => {
      const next = new Set(cur);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const setMany = (keys: string[], on: boolean) =>
    setAccepted((cur) => {
      const next = new Set(cur);
      for (const k of keys) (on ? next.add(k) : next.delete(k));
      return next;
    });

  // A neighbor is affected (left in alert) when no accepted bridge touches it.
  const covered = new Set<string>();
  for (const p of analysis.pairs) if (accepted.has(pairKey(p))) { covered.add(p.source); covered.add(p.target); }
  const remaining = Object.keys(analysis.info).filter((id) => !covered.has(id));

  const hasPairs = analysis.pairs.length > 0;
  const labelStyle = { fontSize: ".68rem", textTransform: "uppercase" as const, letterSpacing: ".05em", color: MUTED };

  return (
    <Panel
      title={t("delete.title", { name: node.label })}
      onClose={onCancel}
      style={{ left: "50%", top: "46%", transform: "translate(-50%, -50%)", width: 440, maxWidth: "calc(100vw - 32px)" }}
    >
      <div style={{ display: "flex", gap: 14, marginBottom: hasPairs ? 10 : 6, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <NeighborList title={t("delete.dependsOn")} ids={analysis.prereqs} labelOf={labelOf} />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <NeighborList title={t("delete.requiredBy")} ids={analysis.dependents} labelOf={labelOf} />
        </div>
      </div>

      {hasPairs && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={labelStyle}>{t("delete.rebuildIntro")}</div>
            <span style={{ flex: 1 }} />
            <button onClick={() => setMany(visibleKeys, true)} style={linkBtn}>{t("delete.selectAll")}</button>
            <span style={{ color: MUTED, fontSize: ".7rem" }}>·</span>
            <button onClick={() => setMany(visibleKeys, false)} style={linkBtn}>{t("delete.deselectAll")}</button>
          </div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("delete.filterPh")}
            style={{ font: "inherit", fontSize: ".78rem", padding: "5px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)", width: "100%", marginBottom: 6 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10, maxHeight: 230, overflowY: "auto" }}>
            {groups.map(([src, ps]) => (
              <div key={src}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <b style={{ fontSize: ".78rem" }}>{labelOf(src)}</b>
                  <span style={{ fontSize: ".7rem", color: MUTED }}>{t("delete.reconnectTo")}</span>
                </div>
                {ps.map((p) => {
                  const k = pairKey(p);
                  return (
                    <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".82rem", cursor: "pointer", padding: "2px 2px 2px 10px" }}>
                      <input type="checkbox" checked={accepted.has(k)} onChange={() => toggle(k)} />
                      <span>{labelOf(p.target)}</span>
                    </label>
                  );
                })}
              </div>
            ))}
            {groups.length === 0 && <div style={{ fontSize: ".78rem", color: MUTED, padding: "4px 2px" }}>{t("delete.noMatches")}</div>}
          </div>
        </>
      )}

      {remaining.length > 0 ? (
        <div style={{ fontSize: ".78rem", color: MUTED, marginBottom: 8, lineHeight: 1.5 }}>
          {t("delete.remainingIntro", { count: remaining.length })}
          <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {remaining.map((id) => (
              <span key={id} style={severityChip(analysis.info[id].severity)}>
                {labelOf(id)} · {t(severityKey(analysis.info[id].severity))}
              </span>
            ))}
          </div>
        </div>
      ) : (
        hasPairs && <div style={{ fontSize: ".78rem", color: MUTED, marginBottom: 8 }}>{t("delete.allRebuilt")}</div>
      )}

      <div style={{ fontSize: ".72rem", color: MUTED, lineHeight: 1.5, marginBottom: 12, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
        {t("delete.legend")}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="ghost" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button variant="danger" onClick={() => onConfirm(accepted)}>{t("delete.confirm")}</Button>
      </div>
    </Panel>
  );
}

const linkBtn = {
  border: "none",
  background: "transparent",
  color: "var(--accent)",
  cursor: "pointer",
  fontSize: ".72rem",
  padding: 0,
};
