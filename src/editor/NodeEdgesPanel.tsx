import { Panel } from "./ui/primitives";
import { MUTED } from "./theme";
import { t } from "./i18n";
import type { GraphEdge, GraphNode } from "../core/types";

export interface NodeEdgesPanelProps {
  node: GraphNode;
  edges: GraphEdge[];
  at: { x: number; y: number };
  infoOf: (id: string) => { label: string; section?: string };
  onDelete: (id: string) => void;
  onClose: () => void;
}

interface Row {
  id: string;
  relation: string;
  otherId: string;
  tone: "up" | "down" | "comment";
}

/** Node-level connection manager (N-23): every dependency and comment edge that
 *  touches the node, with its direction and the other end, and a per-row remove.
 *  Branch edges are a rendering artifact (not in the model), so they never show
 *  here and every listed row is removable. */
export function NodeEdgesPanel({ node, edges, at, infoOf, onDelete, onClose }: NodeEdgesPanelProps) {
  const rows: Row[] = edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      if (e.kind === "comment") {
        return { id: e.id, relation: t("edgesPanel.comment"), otherId: e.source === node.id ? e.target : e.source, tone: "comment" as const };
      }
      // dependency: into the node means the node depends on the source;
      // out of the node means another node depends on this one.
      if (e.target === node.id) return { id: e.id, relation: t("edgesPanel.dependsOn"), otherId: e.source, tone: "up" as const };
      return { id: e.id, relation: t("edgesPanel.requiredBy"), otherId: e.target, tone: "down" as const };
    });

  const x = Math.min(at.x + 12, window.innerWidth - 320);
  const y = Math.min(at.y + 12, window.innerHeight - 320);
  const toneColor = (tone: Row["tone"]) => (tone === "up" ? "var(--up)" : tone === "down" ? "var(--down)" : "#caa83a");

  return (
    <Panel title={t("edgesPanel.title", { name: node.label })} onClose={onClose} style={{ left: x, top: y, minWidth: 260, maxWidth: 320 }}>
      {rows.length === 0 ? (
        <div style={{ fontSize: ".8rem", color: MUTED, padding: "4px 0" }}>{t("edgesPanel.empty")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "min(50vh, 360px)", overflowY: "auto" }}>
          {rows.map((r) => {
            const info = infoOf(r.otherId);
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  borderLeft: `3px solid ${toneColor(r.tone)}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".04em", color: MUTED }}>{r.relation}</div>
                  <div style={{ fontSize: ".82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <b>{info.label}</b>
                    {info.section && <span style={{ color: MUTED }}> · {info.section}</span>}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(r.id)}
                  title={t("edgesPanel.delete")}
                  style={{ border: "1px solid var(--line)", background: "transparent", color: "var(--ghost)", cursor: "pointer", fontSize: ".82rem", borderRadius: 6, padding: "2px 7px", flexShrink: 0 }}
                >
                  🗑
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
