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

/** Confirmation shown when deleting a node that other nodes depend on (N-44).
 *  The model is dependent-centric: each dependent loses its prerequisite, so the
 *  dialog groups by dependent and offers to reconnect it to one of the removed
 *  node's prerequisites. Dependents left unreconnected are previewed with their
 *  severity. Prerequisites are never flagged. */
export function DeleteNodeDialog({ node, analysis, labelOf, onConfirm, onCancel }: DeleteNodeDialogProps) {
  // Default: reconnect every dependent to every prerequisite (preserve the chain;
  // undoable). The user unchecks the ones they do not want.
  const [accepted, setAccepted] = useState<Set<string>>(() => new Set(analysis.pairs.map(pairKey)));
  const [filter, setFilter] = useState("");

  // One group per dependent, holding its reconnection options (pairs to the
  // removed node's prerequisites). Filtered by the dependent or prerequisite name.
  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const byDep = new Map<string, { source: string; target: string }[]>();
    for (const d of analysis.dependents) byDep.set(d, []);
    for (const p of analysis.pairs) byDep.get(p.target)!.push(p);
    const rows = [...byDep.entries()].map(([dep, pairs]) => ({ dep, pairs }));
    if (!q) return rows;
    return rows.filter((r) => labelOf(r.dep).toLowerCase().includes(q) || r.pairs.some((p) => labelOf(p.source).toLowerCase().includes(q)));
  }, [analysis.dependents, analysis.pairs, filter, labelOf]);

  const visibleKeys = useMemo(() => groups.flatMap((g) => g.pairs.map(pairKey)), [groups]);

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

  // A dependent is flagged when no accepted bridge gives it a prerequisite.
  const covered = new Set<string>();
  for (const p of analysis.pairs) if (accepted.has(pairKey(p))) covered.add(p.target);
  const remaining = analysis.dependents.filter((d) => !covered.has(d));

  const hasDeps = analysis.dependents.length > 0;
  const labelStyle = { fontSize: ".68rem", textTransform: "uppercase" as const, letterSpacing: ".05em", color: MUTED };

  return (
    <Panel
      title={t("delete.title", { name: node.label })}
      onClose={onCancel}
      style={{ left: "50%", top: "46%", transform: "translate(-50%, -50%)", width: 440, maxWidth: "calc(100vw - 32px)" }}
    >
      {hasDeps ? (
        <>
          <div style={{ fontSize: ".82rem", marginBottom: 8 }}>{t("delete.reconnectIntro")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={labelStyle}>{t("delete.requiredBy")}</div>
            <span style={{ flex: 1 }} />
            <button onClick={() => setMany(visibleKeys, true)} style={linkBtn} disabled={visibleKeys.length === 0}>{t("delete.selectAll")}</button>
            <span style={{ color: MUTED, fontSize: ".7rem" }}>·</span>
            <button onClick={() => setMany(visibleKeys, false)} style={linkBtn} disabled={visibleKeys.length === 0}>{t("delete.deselectAll")}</button>
          </div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("delete.filterPh")}
            style={{ font: "inherit", fontSize: ".78rem", padding: "5px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)", width: "100%", marginBottom: 6 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10, maxHeight: 230, overflowY: "auto" }}>
            {groups.map(({ dep, pairs }) => (
              <div key={dep}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <b style={{ fontSize: ".82rem" }}>{labelOf(dep)}</b>
                  <span style={{ fontSize: ".7rem", color: MUTED }}>{pairs.length ? t("delete.reconnectTo") : t("delete.noReconnect")}</span>
                </div>
                {pairs.map((p) => {
                  const k = pairKey(p);
                  return (
                    <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".82rem", cursor: "pointer", padding: "2px 2px 2px 10px" }}>
                      <input type="checkbox" checked={accepted.has(k)} onChange={() => toggle(k)} />
                      <span>{labelOf(p.source)}</span>
                    </label>
                  );
                })}
              </div>
            ))}
            {groups.length === 0 && <div style={{ fontSize: ".78rem", color: MUTED, padding: "4px 2px" }}>{t("delete.noMatches")}</div>}
          </div>

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
            <div style={{ fontSize: ".78rem", color: MUTED, marginBottom: 8 }}>{t("delete.allRebuilt")}</div>
          )}

          <div style={{ fontSize: ".72rem", color: MUTED, lineHeight: 1.5, marginBottom: 12, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
            {t("delete.legend")}
          </div>
        </>
      ) : (
        <div style={{ fontSize: ".85rem", color: MUTED, marginBottom: 12 }}>{t("delete.noDeps")}</div>
      )}

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
