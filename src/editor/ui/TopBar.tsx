import { useState, type ReactNode } from "react";
import { Button } from "./primitives";
import { MUTED, PANEL, INK } from "../theme";
import { t } from "../i18n";
import { nextLayerOrder, type Prefs, type Mode } from "../api";

export interface TopBarActions {
  onAddNode: () => void;
  onNewFromBuiltIn: () => void;
  onLoadDemo: () => void;
  onExportPng: () => void;
  onExportSgm: () => void;
  onImportSgm?: () => void;
  onFit: () => void;
  onResetLayout: () => void;
  onToggleTheme: () => void;
  onOpenPrefs: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  prefs: Prefs;
  onPrefsChange: (p: Partial<Prefs>) => void;
  /** count of nodes under a relational-integrity alert (N-44); 0 hides the badge. */
  alertCount: number;
  /** open the Rebuild relations panel. */
  onOpenRebuild: () => void;
}

export interface TopBarProps extends TopBarActions {
  projectName: string;
  mode: Mode;
  genDocs: number;
  totalDocs: number;
  sections: number;
}

function MenuItem({ label, onClick, shortcut, disabled, title }: { label: string; onClick: () => void; shortcut?: string; disabled?: boolean; title?: string }) {
  return (
    <button
      disabled={disabled}
      title={title}
      onClick={onClick}
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        width: "100%",
        textAlign: "left",
        border: "none",
        background: "transparent",
        color: disabled ? MUTED : INK,
        cursor: disabled ? "default" : "pointer",
        padding: "5px 8px",
        borderRadius: 6,
        fontSize: ".82rem",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = "rgba(127,127,127,.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span>{label}</span>
      {shortcut && <span style={{ color: MUTED, fontSize: ".72rem" }}>{shortcut}</span>}
    </button>
  );
}

function Menu({ label, children, open, onToggle }: { label: string; children: ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onToggle}
        style={{
          border: "none",
          background: open ? "rgba(127,127,127,.14)" : "transparent",
          color: INK,
          cursor: "pointer",
          padding: "5px 9px",
          borderRadius: 6,
          fontSize: ".82rem",
        }}
      >
        {label}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 2,
            background: PANEL,
            border: "1px solid var(--line)",
            borderRadius: 9,
            boxShadow: "0 12px 30px rgba(0,0,0,.28)",
            padding: 5,
            minWidth: 190,
            zIndex: 70,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function TopBar(p: TopBarProps) {
  const [menu, setMenu] = useState<string | null>(null);
  const close = () => setMenu(null);
  const toggle = (m: string) => setMenu((cur) => (cur === m ? null : m));
  const connected = p.mode === "connected";

  const check = (on: boolean) => (on ? "☑" : "☐");

  return (
    <div
      onMouseLeave={close}
      style={{ borderBottom: "1px solid var(--line)", background: PANEL, position: "relative", zIndex: 40 }}
    >
      {/* menu bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "3px 8px" }}>
        <strong style={{ fontSize: ".95rem", margin: "0 8px 0 4px" }}>Strata</strong>
        <Menu label={t("menu.file")} open={menu === "file"} onToggle={() => toggle("file")}>
          <MenuItem label={t("menu.file.add")} shortcut="N" onClick={() => { close(); p.onAddNode(); }} />
          <MenuItem label={t("menu.file.new")} disabled={connected} title={connected ? t("tip.newConnected") : undefined} onClick={() => { close(); p.onNewFromBuiltIn(); }} />
          <MenuItem label={t("menu.file.demo")} disabled={connected} title={connected ? t("tip.newConnected") : undefined} onClick={() => { close(); p.onLoadDemo(); }} />
          {p.onImportSgm && <MenuItem label={t("menu.file.import")} onClick={() => { close(); p.onImportSgm!(); }} />}
          <MenuItem label={t("menu.file.export")} onClick={() => { close(); p.onExportSgm(); }} />
          <MenuItem label={t("menu.file.png")} onClick={() => { close(); p.onExportPng(); }} />
        </Menu>
        <Menu label={t("menu.edit")} open={menu === "edit"} onToggle={() => toggle("edit")}>
          <MenuItem label={t("menu.edit.undo")} shortcut="Ctrl+Z" disabled={!p.canUndo} onClick={() => { close(); p.onUndo(); }} />
          <MenuItem label={t("menu.edit.redo")} shortcut="Ctrl+Y" disabled={!p.canRedo} onClick={() => { close(); p.onRedo(); }} />
          <MenuItem label={t("menu.edit.prefs")} onClick={() => { close(); p.onOpenPrefs(); }} />
        </Menu>
        <Menu label={t("menu.view")} open={menu === "view"} onToggle={() => toggle("view")}>
          <MenuItem label={t("menu.view.fit")} onClick={() => { close(); p.onFit(); }} />
          <MenuItem label={t("menu.view.reset")} onClick={() => { close(); p.onResetLayout(); }} />
          <MenuItem
            label={t("menu.view.layout", { value: t(p.prefs.layout === "vertical" ? "layout.vertical" : "layout.horizontal") })}
            onClick={() => p.onPrefsChange({ layout: p.prefs.layout === "vertical" ? "horizontal" : "vertical" })}
          />
          <MenuItem label={`${check(p.prefs.dimMissing)}  ${t("menu.view.dimMissing")}`} onClick={() => p.onPrefsChange({ dimMissing: !p.prefs.dimMissing })} />
          <MenuItem label={`${check(p.prefs.edgeColor === "section")}  ${t("menu.view.colorBySection")}`} onClick={() => p.onPrefsChange({ edgeColor: p.prefs.edgeColor === "section" ? "neutral" : "section" })} />
          <MenuItem label={`${check(p.prefs.showDeps)}  ${t("menu.view.showDeps")}`} onClick={() => p.onPrefsChange({ showDeps: !p.prefs.showDeps })} />
          <MenuItem label={`${check(p.prefs.hoverHighlight)}  ${t("menu.view.hoverPaths")}`} onClick={() => p.onPrefsChange({ hoverHighlight: !p.prefs.hoverHighlight })} />
          <MenuItem label={`${check(p.prefs.autoGrowBands)}  ${t("menu.view.autoGrow")}`} onClick={() => p.onPrefsChange({ autoGrowBands: !p.prefs.autoGrowBands })} />
          <MenuItem
            label={t("menu.view.layers", { value: t(`layer.${p.prefs.layerOrder}`) })}
            onClick={() => p.onPrefsChange({ layerOrder: nextLayerOrder(p.prefs.layerOrder) })}
          />
          <MenuItem
            label={t("menu.view.rebuild")}
            disabled={p.alertCount === 0}
            title={p.alertCount === 0 ? t("menu.view.rebuild.none") : undefined}
            onClick={() => { close(); p.onOpenRebuild(); }}
          />
          <MenuItem label={t("menu.view.theme")} onClick={() => { close(); p.onToggleTheme(); }} />
        </Menu>

        <span style={{ flex: 1 }} />
        {p.alertCount > 0 && (
          <button
            key={p.alertCount}
            className="strata-badge-flash"
            onClick={p.onOpenRebuild}
            title={t("badge.alerts.tip")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: ".68rem",
              fontWeight: 700,
              padding: "2px 9px",
              borderRadius: 999,
              border: "1px solid var(--ghost)",
              background: "rgba(192,57,43,.14)",
              color: "var(--ghost)",
              cursor: "pointer",
            }}
          >
            ⛓️‍💥 {t("badge.alerts", { count: p.alertCount })}
          </button>
        )}
        <span
          title={connected ? t("badge.connected.tip") : t("badge.static.tip")}
          style={{ fontSize: ".68rem", fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: connected ? "rgba(31,138,76,.15)" : "var(--line)", color: connected ? "#1f8a4c" : MUTED }}
        >
          {connected ? t("badge.connected") : t("badge.static")}
        </span>
        <span style={{ color: MUTED, fontSize: ".78rem", margin: "0 6px" }}>
          {t("badge.summary", { project: p.projectName, gen: p.genDocs, total: p.totalDocs, sections: p.sections })}
        </span>
      </div>

      {/* quick toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderTop: "1px solid var(--line)" }}>
        <Button onClick={p.onAddNode} variant="primary">＋ {t("action.node")}</Button>
        <Button onClick={p.onNewFromBuiltIn} disabled={connected} title={connected ? t("tip.newConnected") : t("tip.new")}>⊕ {t("quickbar.new")}</Button>
        <Button onClick={p.onUndo} title={t("tip.undo")} style={p.canUndo ? undefined : { opacity: 0.5 }}>↶</Button>
        <Button onClick={p.onRedo} title={t("tip.redo")} style={p.canRedo ? undefined : { opacity: 0.5 }}>↷</Button>
        <span style={{ width: 1, height: 20, background: "var(--line)", margin: "0 3px" }} />
        <Button onClick={p.onExportPng} title={t("tip.png")}>⇩ PNG</Button>
        <Button onClick={p.onFit} title={t("tip.fit")}>⤢ {t("quickbar.fit")}</Button>
        <Button onClick={p.onResetLayout} title={t("tip.reset")}>⟳ {t("quickbar.reset")}</Button>
        {p.alertCount > 0 && (
          <Button onClick={p.onOpenRebuild} active title={t("tip.rebuild")} style={{ borderColor: "var(--ghost)", color: "var(--ghost)" }}>
            ⛓️‍💥 {t("quickbar.rebuild")}
          </Button>
        )}
        <span style={{ flex: 1 }} />
        <Button onClick={() => p.onPrefsChange({ hoverHighlight: !p.prefs.hoverHighlight })} active={p.prefs.hoverHighlight} title={t("tip.paths")}>✦ {t("quickbar.paths")}</Button>
        <Button onClick={() => p.onPrefsChange({ autoGrowBands: !p.prefs.autoGrowBands })} active={p.prefs.autoGrowBands} title={t("tip.autoGrow")}>⇲ {t("quickbar.autoGrow")}</Button>
        <Button onClick={() => p.onPrefsChange({ dimMissing: !p.prefs.dimMissing })} active={p.prefs.dimMissing} title={t("tip.dimMissing")}>{t("quickbar.dimMissing")}</Button>
        <Button onClick={() => p.onPrefsChange({ layerOrder: nextLayerOrder(p.prefs.layerOrder) })} title={t("tip.layers")}>⿻ {t(`layer.${p.prefs.layerOrder}.short`)}</Button>
        <Button onClick={p.onOpenPrefs} title={t("tip.prefs")}>⚙</Button>
        <Button onClick={p.onToggleTheme} title={t("tip.theme")}>◐</Button>
      </div>
    </div>
  );
}
