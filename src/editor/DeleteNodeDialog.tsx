import { useState } from "react";
import { Panel, Button } from "./ui/primitives";
import { MUTED } from "./theme";
import { t } from "./i18n";
import type { GraphNode } from "../core/types";
import type { BreakAnalysis } from "./integrity";

const pairKey = (p: { source: string; target: string }): string => `${p.source}\u0000${p.target}`;

export interface DeleteNodeDialogProps {
  node: GraphNode;
  analysis: BreakAnalysis;
  labelOf: (id: string) => string;
  onConfirm: (acceptedKeys: Set<string>) => void;
  onCancel: () => void;
}

/** Confirmation shown when deleting a node whose removal breaks dependency links
 *  (N-44). Offers to rebuild each prerequisite -> dependent bridge that passed
 *  through the node (opt-in per pair, on by default), and lists the neighbors
 *  that will be left under a broken-link alert if their bridge is not taken. */
export function DeleteNodeDialog({ node, analysis, labelOf, onConfirm, onCancel }: DeleteNodeDialogProps) {
  // Default: rebuild every bridge (preserving the chain is the common intent and
  // every step is undoable); the user unchecks the ones they do not want.
  const [accepted, setAccepted] = useState<Set<string>>(() => new Set(analysis.pairs.map(pairKey)));

  const toggle = (key: string) =>
    setAccepted((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Neighbors that remain affected given the current choices: lonely ones always,
  // plus any node whose only bridges are unchecked.
  const covered = new Set<string>();
  for (const p of analysis.pairs) if (accepted.has(pairKey(p))) { covered.add(p.source); covered.add(p.target); }
  const remaining = Object.keys(analysis.info).filter((id) => !covered.has(id));

  return (
    <Panel
      title={t("delete.title", { name: node.label })}
      onClose={onCancel}
      style={{ left: "50%", top: "42%", transform: "translate(-50%, -50%)", minWidth: 320, maxWidth: 420 }}
    >
      {analysis.pairs.length > 0 && (
        <>
          <div style={{ fontSize: ".82rem", marginBottom: 8 }}>{t("delete.rebuildIntro")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10, maxHeight: 220, overflowY: "auto" }}>
            {analysis.pairs.map((p) => {
              const key = pairKey(p);
              return (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".82rem", cursor: "pointer", padding: "3px 2px" }}>
                  <input type="checkbox" checked={accepted.has(key)} onChange={() => toggle(key)} />
                  <span>
                    <b>{labelOf(p.source)}</b>
                    <span style={{ color: MUTED }}> {t("delete.dependsArrow")} </span>
                    <b>{labelOf(p.target)}</b>
                  </span>
                </label>
              );
            })}
          </div>
        </>
      )}

      {remaining.length > 0 ? (
        <div style={{ fontSize: ".78rem", color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>
          {t("delete.remainingIntro", { count: remaining.length })}
          <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {remaining.map((id) => (
              <span
                key={id}
                style={{
                  fontSize: ".72rem",
                  padding: "2px 7px",
                  borderRadius: 6,
                  color: "var(--ghost)",
                  background: "rgba(192,57,43,.14)",
                  whiteSpace: "nowrap",
                }}
              >
                {labelOf(id)} · {t(analysis.info[id].severity === "orphan" ? "alert.severity.orphan" : "alert.severity.partial")}
              </span>
            ))}
          </div>
        </div>
      ) : (
        analysis.pairs.length > 0 && (
          <div style={{ fontSize: ".78rem", color: MUTED, marginBottom: 10 }}>{t("delete.allRebuilt")}</div>
        )
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="ghost" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button variant="danger" onClick={() => onConfirm(accepted)}>{t("delete.confirm")}</Button>
      </div>
    </Panel>
  );
}
