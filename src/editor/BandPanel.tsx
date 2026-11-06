import { Panel, Button, Field } from "./ui/primitives";
import { MUTED, accent } from "./theme";
import { t } from "./i18n";
import { toLocalInput, fromLocalInput, Countdown } from "./NodeOverlay";
import type { GraphNode, Section } from "../core/types";

export interface BandPanelProps {
  /** the section being managed (label and hue already reflect overrides). */
  section: Section;
  /** the section's central node (carries the band's own lock/due meta). */
  central: GraphNode;
  at: { x: number; y: number };
  /** whether the band's hue / label are overridden over the built-in model. */
  customHue: boolean;
  customLabel: boolean;
  /** effective auto-grow for this band, and whether it overrides the global toggle. */
  grow: boolean;
  growOverridden: boolean;
  onClose: () => void;
  onSetNodeMeta: (id: string, meta: { createdAt?: number; dueAt?: number; locked?: boolean }) => void;
  onSetSectionHue: (id: string, hue: number) => void;
  onResetSectionHue: (id: string) => void;
  onSetSectionLabel: (id: string, label: string) => void;
  onResetSectionLabel: (id: string) => void;
  onSetBandGrow: (id: string, on: boolean) => void;
  onResetBandGrow: (id: string) => void;
  onResetBandLayout: (id: string) => void;
}

/** The band's management panel, opened from the central (the band's
 *  representative): identity (rename, color), the central's own lock/due, and,
 *  in later batches, per-band grow, the node list, reorder and removal. */
export function BandPanel({
  section,
  central,
  at,
  customHue,
  customLabel,
  grow,
  growOverridden,
  onClose,
  onSetNodeMeta,
  onSetSectionHue,
  onResetSectionHue,
  onSetSectionLabel,
  onResetSectionLabel,
  onSetBandGrow,
  onResetBandGrow,
  onResetBandLayout,
}: BandPanelProps) {
  const x = Math.min(at.x + 12, window.innerWidth - 330);
  const y = Math.min(at.y + 12, window.innerHeight - 320);

  const ResetLink = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      title={t("band.reset.tip")}
      style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: ".72rem" }}
    >
      {t("band.reset")}
    </button>
  );

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

      {/* rename */}
      <Field label={t("band.name")}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {customLabel && <ResetLink onClick={() => onResetSectionLabel(section.id)} />}
          <input
            type="text"
            value={section.label}
            aria-label={t("band.name")}
            onChange={(e) => onSetSectionLabel(section.id, e.target.value)}
            style={{ font: "inherit", fontSize: ".82rem", padding: "3px 7px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)", width: 150 }}
          />
        </div>
      </Field>

      {/* color (hue) */}
      <div style={{ margin: "7px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span aria-hidden style={{ width: 14, height: 14, borderRadius: 4, background: accent(section.hue), border: "1px solid var(--line)", flexShrink: 0 }} />
          <span style={{ color: MUTED, fontSize: ".82rem", flex: 1 }}>{t("band.color")}</span>
          {customHue && <ResetLink onClick={() => onResetSectionHue(section.id)} />}
        </div>
        <input
          type="range"
          min={0}
          max={360}
          value={section.hue}
          aria-label={t("band.color")}
          onChange={(e) => onSetSectionHue(section.id, Number(e.target.value))}
          style={{ width: "100%", accentColor: accent(section.hue) }}
        />
      </div>

      {/* due date */}
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

      {/* per-band grow + re-arrange */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "9px 0 4px", paddingTop: 8, borderTop: "1px solid var(--line)" }}>
        <Button active={grow} title={t("band.grow.tip")} onClick={() => onSetBandGrow(section.id, !grow)}>
          {t("band.grow")}
        </Button>
        {growOverridden && <ResetLink onClick={() => onResetBandGrow(section.id)} />}
        <Button title={t("band.rearrange.tip")} onClick={() => onResetBandLayout(section.id)} style={{ marginLeft: "auto" }}>
          {t("band.rearrange")}
        </Button>
      </div>

      <div style={{ fontSize: ".74rem", color: MUTED, marginTop: 10, lineHeight: 1.4 }}>{t("band.panel.empty")}</div>
    </Panel>
  );
}
