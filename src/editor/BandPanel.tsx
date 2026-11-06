import { Panel, Button, Field } from "./ui/primitives";
import { MUTED } from "./theme";
import { t } from "./i18n";
import { toLocalInput, fromLocalInput, Countdown } from "./NodeOverlay";
import type { GraphNode, Section } from "../core/types";

export interface BandPanelProps {
  /** the section being managed. */
  section: Section;
  /** the section's central node (carries the band's own lock/due meta). */
  central: GraphNode;
  at: { x: number; y: number };
  onClose: () => void;
  onSetNodeMeta: (id: string, meta: { createdAt?: number; dueAt?: number; locked?: boolean }) => void;
}

/** The band's management panel, opened from the central (the band's
 *  representative). This is the shell: it carries the band identity and the
 *  central's own lock/due; color, rename, per-band grow, the node list, reorder
 *  and removal land here in the following batches. */
export function BandPanel({ section, central, at, onClose, onSetNodeMeta }: BandPanelProps) {
  const x = Math.min(at.x + 12, window.innerWidth - 330);
  const y = Math.min(at.y + 12, window.innerHeight - 280);

  return (
    <Panel title={t("band.panel.title", { label: section.label })} onClose={onClose} style={{ left: x, top: y }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
        <Button
          active={central.locked}
          title={central.locked ? t("overlay.unlock.tip") : t("overlay.lock.tip")}
          onClick={() => onSetNodeMeta(central.id, { locked: !central.locked })}
        >
          {central.locked ? "🔒" : "🔓"}
        </Button>
      </div>

      <Field label={t("overlay.dueDate")}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="datetime-local"
            value={toLocalInput(central.dueAt)}
            onChange={(e) => onSetNodeMeta(central.id, { dueAt: fromLocalInput(e.target.value) })}
            style={{ font: "inherit", fontSize: ".78rem", padding: "3px 6px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)" }}
          />
          {central.dueAt && (
            <button
              onClick={() => onSetNodeMeta(central.id, { dueAt: undefined })}
              title={t("overlay.clearDue")}
              style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: ".9rem" }}
            >
              ✕
            </button>
          )}
        </div>
      </Field>
      {central.dueAt && (
        <div style={{ fontSize: ".78rem", margin: "2px 0 6px", textAlign: "right" }}>
          <Countdown dueAt={central.dueAt} />
        </div>
      )}

      <div style={{ fontSize: ".74rem", color: MUTED, marginTop: 10, lineHeight: 1.4 }}>{t("band.panel.empty")}</div>
    </Panel>
  );
}
