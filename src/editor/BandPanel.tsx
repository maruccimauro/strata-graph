import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Panel, Button, Field, Combobox } from "./ui/primitives";
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
  /** the band's doc nodes (central excluded), already merged with overrides. */
  nodes: GraphNode[];
  /** every section, for the "move all to…" picker and the reorder list. */
  sections: Section[];
  onMoveSection: (id: string, dir: -1 | 1) => void;
  onReorderSection: (id: string, targetIndex: number) => void;
  onClose: () => void;
  onSetNodeMeta: (id: string, meta: { createdAt?: number; dueAt?: number; locked?: boolean }) => void;
  onSetNodeMetaMany: (ids: string[], meta: { dueAt?: number; locked?: boolean }) => void;
  onSetSectionMany: (ids: string[], sectionId: string) => void;
  onRequestDeleteNode: (id: string) => void;
  onRequestBulkDelete: (ids: string[], bandLabel: string) => void;
  onOpenNode: (node: GraphNode) => void;
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
  nodes,
  sections,
  onMoveSection,
  onReorderSection,
  onClose,
  onSetNodeMeta,
  onSetNodeMetaMany,
  onSetSectionMany,
  onRequestDeleteNode,
  onRequestBulkDelete,
  onOpenNode,
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

  const rows = [...nodes].sort((a, b) => a.label.localeCompare(b.label));
  const allIds = rows.map((n) => n.id);
  const deletableIds = rows.filter((n) => n.status !== "missing").map((n) => n.id);
  const otherSections = sections.filter((s) => s.id !== section.id);

  // Band reorder list: ordered bands, with a live local preview while dragging a
  // row by its grip (midpoint-swap). The move is committed once on drop, so a
  // drag is a single undo step; the ↑/↓ arrows commit one step each.
  const ordered = [...sections].sort((a, b) => a.order - b.order);
  const byId = (id: string) => sections.find((s) => s.id === id);
  const [dragId, setDragId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[] | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const displayIds = preview ?? ordered.map((s) => s.id);

  const gripDown = (e: ReactPointerEvent, id: string) => {
    e.preventDefault();
    setDragId(id);
    setPreview(ordered.map((s) => s.id));
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const gripMove = (e: ReactPointerEvent) => {
    if (!dragId || !preview) return;
    const above = preview.filter((id) => id !== dragId && (rowRefs.current[id]?.getBoundingClientRect().top ?? 0) + (rowRefs.current[id]?.getBoundingClientRect().height ?? 0) / 2 < e.clientY).length;
    const next = preview.filter((id) => id !== dragId);
    next.splice(above, 0, dragId);
    if (next.join() !== preview.join()) setPreview(next);
  };
  const gripUp = () => {
    if (dragId && preview) {
      const idx = preview.indexOf(dragId);
      if (idx !== ordered.findIndex((s) => s.id === dragId)) onReorderSection(dragId, idx);
    }
    setDragId(null);
    setPreview(null);
  };

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

      {/* band reorder list */}
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
        <div style={{ fontSize: ".78rem", fontWeight: 600, marginBottom: 6 }}>{t("band.reorder")}</div>
        <div onPointerMove={gripMove} onPointerUp={gripUp} onPointerCancel={gripUp} style={{ maxHeight: 170, overflowY: "auto", margin: "0 -2px" }}>
          {displayIds.map((id, i) => {
            const s = byId(id);
            if (!s) return null;
            const isCurrent = s.id === section.id;
            return (
              <div
                key={id}
                ref={(el) => { rowRefs.current[id] = el; }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "3px 4px", borderRadius: 5,
                  background: isCurrent ? "rgba(127,127,127,.14)" : "transparent", opacity: dragId === id ? 0.45 : 1,
                }}
              >
                <span
                  onPointerDown={(e) => gripDown(e, id)}
                  title={t("band.reorder.drag")}
                  style={{ cursor: "grab", color: MUTED, fontSize: ".9rem", lineHeight: 1, touchAction: "none", userSelect: "none" }}
                >
                  ⠿
                </span>
                <span aria-hidden style={{ width: 11, height: 11, borderRadius: 3, background: accent(s.hue), border: "1px solid var(--line)", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: ".8rem", fontWeight: isCurrent ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                <Button variant="ghost" disabled={i === 0} title={t("band.moveUp")} onClick={() => onMoveSection(id, -1)}>↑</Button>
                <Button variant="ghost" disabled={i === displayIds.length - 1} title={t("band.moveDown")} onClick={() => onMoveSection(id, 1)}>↓</Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* node list + bulk actions */}
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: ".78rem", fontWeight: 600 }}>{t("band.nodes")}</span>
          <span style={{ fontSize: ".72rem", color: MUTED }}>{rows.length}</span>
        </div>

        {rows.length === 0 ? (
          <div style={{ fontSize: ".74rem", color: MUTED, lineHeight: 1.4 }}>{t("band.nodes.empty")}</div>
        ) : (
          <div style={{ maxHeight: 190, overflowY: "auto", margin: "0 -2px" }}>
            {rows.map((n) => {
              const faded = n.status === "missing" || n.status === "unavailable";
              return (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 2px" }}>
                  <button
                    onClick={() => onOpenNode(n)}
                    title={t("band.node.open")}
                    style={{
                      flex: 1, textAlign: "left", border: "none", background: "transparent", cursor: "pointer",
                      font: "inherit", fontSize: ".8rem", color: "var(--ink)", opacity: faded ? 0.55 : 1,
                      textDecoration: n.status === "unavailable" ? "line-through" : "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "3px 4px", borderRadius: 5,
                    }}
                  >
                    {n.label}
                  </button>
                  <Button
                    variant="ghost"
                    active={n.locked}
                    title={n.locked ? t("overlay.unlock.tip") : t("overlay.lock.tip")}
                    onClick={() => onSetNodeMeta(n.id, { locked: !n.locked })}
                  >
                    {n.locked ? "🔒" : "🔓"}
                  </Button>
                  {n.status !== "missing" && (
                    <Button variant="ghost" title={t("band.node.delete")} onClick={() => onRequestDeleteNode(n.id)}>
                      🗑
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {rows.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ fontSize: ".72rem", color: MUTED }}>{t("band.bulk")}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button title={t("band.bulk.lockAll.tip")} onClick={() => onSetNodeMetaMany(allIds, { locked: true })}>{t("band.bulk.lockAll")}</Button>
              <Button title={t("band.bulk.unlockAll.tip")} onClick={() => onSetNodeMetaMany(allIds, { locked: false })}>{t("band.bulk.unlockAll")}</Button>
            </div>
            {otherSections.length > 0 && (
              <Field label={t("band.bulk.moveAll")}>
                <div style={{ width: 150 }}>
                  <Combobox
                    value=""
                    options={otherSections.map((s) => ({ value: s.id, label: s.label }))}
                    onChange={(v) => { if (v) onSetSectionMany(allIds, v); }}
                    placeholder={t("band.bulk.moveAll.ph")}
                  />
                </div>
              </Field>
            )}
            {deletableIds.length > 0 && (
              <Button variant="danger" title={t("band.bulk.delete.tip")} onClick={() => onRequestBulkDelete(deletableIds, section.label)} style={{ alignSelf: "flex-start" }}>
                {t("band.bulk.delete")}
              </Button>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
