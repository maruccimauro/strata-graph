import { useState, type ReactNode } from "react";
import { Button } from "./primitives";
import { MUTED, PANEL, INK } from "../theme";
import type { Prefs, Mode } from "../api";

export interface TopBarActions {
  onAddNode: () => void;
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
}

export interface TopBarProps extends TopBarActions {
  projectName: string;
  mode: Mode;
  genDocs: number;
  totalDocs: number;
  sections: number;
}

function MenuItem({ label, onClick, shortcut, disabled }: { label: string; onClick: () => void; shortcut?: string; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
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
        <Menu label="File" open={menu === "file"} onToggle={() => toggle("file")}>
          <MenuItem label="Add node…" shortcut="N" onClick={() => { close(); p.onAddNode(); }} />
          {p.onImportSgm && <MenuItem label="Import model (.sgm)…" onClick={() => { close(); p.onImportSgm!(); }} />}
          <MenuItem label="Export model (.sgm)…" onClick={() => { close(); p.onExportSgm(); }} />
          <MenuItem label="Export PNG…" onClick={() => { close(); p.onExportPng(); }} />
        </Menu>
        <Menu label="Edit" open={menu === "edit"} onToggle={() => toggle("edit")}>
          <MenuItem label="Undo" shortcut="Ctrl+Z" disabled={!p.canUndo} onClick={() => { close(); p.onUndo(); }} />
          <MenuItem label="Redo" shortcut="Ctrl+Y" disabled={!p.canRedo} onClick={() => { close(); p.onRedo(); }} />
          <MenuItem label="Preferences…" onClick={() => { close(); p.onOpenPrefs(); }} />
        </Menu>
        <Menu label="View" open={menu === "view"} onToggle={() => toggle("view")}>
          <MenuItem label="Fit to screen" onClick={() => { close(); p.onFit(); }} />
          <MenuItem label="Reset layout" onClick={() => { close(); p.onResetLayout(); }} />
          <MenuItem label={`${check(p.prefs.hideMissing)}  Hide not-generated`} onClick={() => p.onPrefsChange({ hideMissing: !p.prefs.hideMissing })} />
          <MenuItem label={`${check(p.prefs.edgeColor === "section")}  Color edges by section`} onClick={() => p.onPrefsChange({ edgeColor: p.prefs.edgeColor === "section" ? "neutral" : "section" })} />
          <MenuItem label={`${check(p.prefs.showDeps)}  Show dependency edges`} onClick={() => p.onPrefsChange({ showDeps: !p.prefs.showDeps })} />
          <MenuItem label="Toggle theme" onClick={() => { close(); p.onToggleTheme(); }} />
        </Menu>

        <span style={{ flex: 1 }} />
        <span
          title={connected ? "Local server: real scan, paths, open file/folder." : "Static: demo graph, localStorage."}
          style={{ fontSize: ".68rem", fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: connected ? "rgba(31,138,76,.15)" : "var(--line)", color: connected ? "#1f8a4c" : MUTED }}
        >
          {connected ? "● Connected" : "○ Static"}
        </span>
        <span style={{ color: MUTED, fontSize: ".78rem", margin: "0 6px" }}>
          {p.projectName} · {p.genDocs}/{p.totalDocs} docs · {p.sections} sections
        </span>
      </div>

      {/* quick toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderTop: "1px solid var(--line)" }}>
        <Button onClick={p.onAddNode} variant="primary">＋ Node</Button>
        <Button onClick={p.onUndo} title="Undo (Ctrl+Z)" style={p.canUndo ? undefined : { opacity: 0.5 }}>↶</Button>
        <Button onClick={p.onRedo} title="Redo (Ctrl+Y)" style={p.canRedo ? undefined : { opacity: 0.5 }}>↷</Button>
        <span style={{ width: 1, height: 20, background: "var(--line)", margin: "0 3px" }} />
        <Button onClick={p.onExportPng} title="Export the diagram as PNG">⇩ PNG</Button>
        <Button onClick={p.onFit} title="Fit to screen">⤢ Fit</Button>
        <Button onClick={p.onResetLayout} title="Reset node positions">⟳ Reset</Button>
        <span style={{ flex: 1 }} />
        <Button onClick={() => p.onPrefsChange({ hideMissing: !p.prefs.hideMissing })} active={p.prefs.hideMissing} title="Hide not-generated nodes">Hide ∅</Button>
        <Button onClick={p.onOpenPrefs} title="Preferences">⚙</Button>
        <Button onClick={p.onToggleTheme} title="Toggle light/dark">◐</Button>
      </div>
    </div>
  );
}
