import { useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
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
  /** vertical layout: bands stack left-to-right, so "up/down" reads "left/right". */
  vertical: boolean;
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

/** One of the band panel's sub-views; "menu" is the hub that lists them. */
type BandView = "menu" | "appearance" | "schedule" | "layout" | "order" | "nodes";

/** The band's management panel, opened from the central (the band's
 *  representative). It is a compact hub: the menu lists the management areas and
 *  each opens its own sub-view (with a Back link), so the panel never grows past
 *  the screen. */
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
  vertical,
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
  const y = Math.min(at.y + 12, window.innerHeight - 340);

  const [view, setView] = useState<BandView>("menu");

  const rows = [...nodes].sort((a, b) => a.label.localeCompare(b.label));
  const allIds = rows.map((n) => n.id);
  const deletableIds = rows.filter((n) => n.status !== "missing").map((n) => n.id);
  const otherSections = sections.filter((s) => s.id !== section.id);

  // Band reorder list: ordered bands, with a live local preview while dragging a
  // row by its grip (midpoint-swap). The move is committed once on drop, so a
  // drag is a single undo step; the ↑/↓ arrows commit one step each.
  const ordered = [...sections].sort((a, b) => a.order - b.order);
  const bandIndex = ordered.findIndex((s) => s.id === section.id);
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

  /** Position indicator for the Band order entry: the previous and next position
   *  numbers, small and muted, around the current one boxed in the band's color. */
  const PositionHint = () => {
    const col = accent(section.hue);
    const small = { color: MUTED, fontSize: ".66rem", opacity: 0.6 } as const;
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {bandIndex > 0 && <span style={small}>{bandIndex}</span>}
        <span style={{ fontSize: ".72rem", fontWeight: 700, color: col, border: `1px solid ${col}`, borderRadius: 4, padding: "0 5px", lineHeight: 1.5 }}>{bandIndex + 1}</span>
        {bandIndex < ordered.length - 1 && <span style={small}>{bandIndex + 2}</span>}
      </span>
    );
  };

  /** Full-width hub entry that opens a sub-view, with an optional status hint. */
  const MenuItem = ({ to, label, hint }: { to: BandView; label: string; hint?: ReactNode }) => (
    <button
      onClick={() => setView(to)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 8,
        padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)",
        color: "var(--ink)", cursor: "pointer", font: "inherit", fontSize: ".84rem",
      }}
    >
      <span>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {hint && <span style={{ color: MUTED, fontSize: ".74rem" }}>{hint}</span>}
        <span style={{ color: MUTED }}>›</span>
      </span>
    </button>
  );

  /** Header for a sub-view: a Back link to the hub plus the sub-view title. */
  const SubHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
      <button
        onClick={() => setView("menu")}
        title={t("band.back")}
        style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", font: "inherit", fontSize: ".8rem" }}
      >
        ‹ {t("band.back")}
      </button>
      <span style={{ fontWeight: 600, fontSize: ".82rem" }}>{title}</span>
    </div>
  );

  const scheduleHint = `${central.locked ? "🔒" : ""}${central.dueAt ? " ⏳" : ""}`.trim();

  return (
    <Panel title={t("band.panel.title", { label: section.label })} onClose={onClose} style={{ left: x, top: y, width: 300 }}>
      {view === "menu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <MenuItem to="appearance" label={t("band.menu.appearance")} hint={customLabel || customHue ? t("band.menu.custom") : undefined} />
          <MenuItem to="schedule" label={t("band.menu.schedule")} hint={scheduleHint || undefined} />
          <MenuItem to="layout" label={t("band.menu.layout")} hint={grow ? t("band.menu.growOn") : t("band.menu.growOff")} />
          <MenuItem to="order" label={t("band.reorder")} hint={<PositionHint />} />
          <MenuItem to="nodes" label={t("band.nodes")} hint={`${rows.length}`} />
        </div>
      )}

      {view === "appearance" && (
        <div>
          <SubHeader title={t("band.menu.appearance")} />
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
        </div>
      )}

      {view === "schedule" && (
        <div>
          <SubHeader title={t("band.menu.schedule")} />
          <div style={{ marginBottom: 8 }}>
            <Button
              active={central.locked}
              title={central.locked ? t("overlay.unlock.tip") : t("overlay.lock.tip")}
              onClick={() => onSetNodeMeta(central.id, { locked: !central.locked })}
            >
              {central.locked ? "🔒" : "🔓"} {central.locked ? t("ctx.unlock") : t("ctx.lock")}
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
        </div>
      )}

      {view === "layout" && (
        <div>
          <SubHeader title={t("band.menu.layout")} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button active={grow} title={t("band.grow.tip")} onClick={() => onSetBandGrow(section.id, !grow)}>
              {t("band.grow")}
            </Button>
            {growOverridden && <ResetLink onClick={() => onResetBandGrow(section.id)} />}
            <Button title={t("band.rearrange.tip")} onClick={() => onResetBandLayout(section.id)} style={{ marginLeft: "auto" }}>
              {t("band.rearrange")}
            </Button>
          </div>
        </div>
      )}

      {view === "order" && (
        <div>
          <SubHeader title={t("band.reorder")} />
          <div onPointerMove={gripMove} onPointerUp={gripUp} onPointerCancel={gripUp} style={{ maxHeight: 260, overflowY: "auto", margin: "0 -2px" }}>
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
                  <Button variant="ghost" disabled={i === 0} title={vertical ? t("band.moveLeft") : t("band.moveUp")} onClick={() => onMoveSection(id, -1)}>{vertical ? "←" : "↑"}</Button>
                  <Button variant="ghost" disabled={i === displayIds.length - 1} title={vertical ? t("band.moveRight") : t("band.moveDown")} onClick={() => onMoveSection(id, 1)}>{vertical ? "→" : "↓"}</Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "nodes" && (
        <div>
          <SubHeader title={`${t("band.nodes")} (${rows.length})`} />
          {rows.length === 0 ? (
            <div style={{ fontSize: ".74rem", color: MUTED, lineHeight: 1.4 }}>{t("band.nodes.empty")}</div>
          ) : (
            <div style={{ maxHeight: 220, overflowY: "auto", margin: "0 -2px" }}>
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
      )}
    </Panel>
  );
}
