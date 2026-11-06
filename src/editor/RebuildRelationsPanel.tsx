import { Panel, Button } from "./ui/primitives";
import { MUTED } from "./theme";
import { t } from "./i18n";
import { severityChip, severityKey } from "./alertStyle";
import type { BreakEvent, AlertSeverity, Prefs } from "./api";

type Pair = { source: string; target: string };

export interface RebuildRelationsPanelProps {
  alerts: BreakEvent[];
  labelOf: (id: string) => string;
  prefs: Prefs;
  onSetPrefs: (p: Partial<Prefs>) => void;
  onConnectOption: (eventId: string, pair: Pair) => void;
  onRemoveOption: (eventId: string, pair: Pair) => void;
  onReconnectDep: (eventId: string, depId: string) => void;
  onUnlinkDep: (eventId: string, depId: string) => void;
  onReconnectEvent: (eventId: string) => void;
  onDismissEvent: (eventId: string) => void;
  onReconnectAll: () => void;
  onDismissAll: () => void;
  activeDep: string | null;
  onActivateDep: (depId: string | null) => void;
  onHoverOption: (opt: Pair | null) => void;
  collapsed: string[];
  onToggleCollapse: (eventId: string) => void;
  onLocate: (nodeId: string) => void;
  onClose: () => void;
}

interface Row { dep: string; options: string[]; severity: AlertSeverity }

function eventRows(ev: BreakEvent): { orphan: Row[]; partial: Row[] } {
  const rows: Row[] = Object.keys(ev.info).map((dep) => ({
    dep,
    options: ev.pairs.filter((p) => p.target === dep).map((p) => p.source),
    severity: ev.info[dep]?.severity ?? "partial",
  }));
  return { orphan: rows.filter((r) => r.severity === "orphan"), partial: rows.filter((r) => r.severity === "partial") };
}

const clamp = (v: number) => Math.max(1, Math.min(3, v));

/** The focused "Rebuild relations" mode (N-44). Four action scopes, each named
 *  for its reach: Connect/Remove one prerequisite option, Reconnect/Unlink one
 *  dependent, Reconnect/Dismiss one deletion event, Reconnect all/Dismiss all
 *  across events. A quick bar tunes the alert waves and the ghost arrows. Clicking
 *  a dependent section focuses it: it locates the node, highlights the section,
 *  and shows only that node's flowing ghost arrows on the canvas. */
export function RebuildRelationsPanel(p: RebuildRelationsPanelProps) {
  const { alerts, labelOf, prefs, onSetPrefs, activeDep, onActivateDep, onHoverOption, collapsed, onToggleCollapse, onLocate } = p;

  const IconBtn = ({ on, label, onClick }: { on?: boolean; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      title={label}
      style={{ border: "1px solid var(--line)", background: on ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "var(--panel)", color: on === false ? MUTED : "var(--ink)", borderColor: on ? "var(--accent)" : "var(--line)", borderRadius: 6, minWidth: 26, height: 24, cursor: "pointer", fontSize: ".82rem", padding: "0 6px" }}
    >
      {label}
    </button>
  );

  const OptionRow = ({ ev, dep, prereq }: { ev: BreakEvent; dep: string; prereq: string }) => (
    <div
      onMouseEnter={() => onHoverOption({ source: prereq, target: dep })}
      onMouseLeave={() => onHoverOption(null)}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%", padding: "4px 7px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--panel)" }}
    >
      <span style={{ fontSize: ".8rem", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{labelOf(prereq)}</span>
      <span style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <Button onClick={(e) => { e?.stopPropagation(); p.onConnectOption(ev.id, { source: prereq, target: dep }); }} title={t("rebuild.connect.tip")}>{t("rebuild.connect")}</Button>
        <Button variant="ghost" onClick={(e) => { e?.stopPropagation(); p.onRemoveOption(ev.id, { source: prereq, target: dep }); }} title={t("rebuild.remove.tip")}>{t("rebuild.remove")}</Button>
      </span>
    </div>
  );

  const DepSection = ({ ev, row }: { ev: BreakEvent; row: Row }) => {
    const active = activeDep === row.dep;
    return (
      <div
        onClick={() => { onActivateDep(active ? null : row.dep); if (!active) onLocate(row.dep); }}
        style={{ cursor: "pointer", borderRadius: 8, border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`, background: active ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "color-mix(in srgb, var(--muted) 6%, transparent)", padding: "7px 8px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <b style={{ fontSize: ".82rem", textDecoration: "underline", textUnderlineOffset: "2px" }}>{labelOf(row.dep)}</b>
          <span style={severityChip(row.severity)}>{t(severityKey(row.severity))}</span>
          <span style={{ flex: 1 }} />
          {row.options.length > 0 && (
            <Button onClick={(e) => { e?.stopPropagation(); p.onReconnectDep(ev.id, row.dep); }} title={t("rebuild.reconnectNode.tip")}>{t("rebuild.reconnectNode")}</Button>
          )}
          <Button variant="ghost" onClick={(e) => { e?.stopPropagation(); p.onUnlinkDep(ev.id, row.dep); }} title={t("rebuild.unlinkNode.tip")}>{t("rebuild.unlinkNode")}</Button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
          {row.options.length > 0 ? (
            row.options.map((pr) => <OptionRow key={pr} ev={ev} dep={row.dep} prereq={pr} />)
          ) : (
            <span style={{ fontSize: ".72rem", color: MUTED }}>{t("rebuild.noOption")}</span>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ ev, severity, rows }: { ev: BreakEvent; severity: AlertSeverity; rows: Row[] }) => {
    if (rows.length === 0) return null;
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0" }}>
          <span style={severityChip(severity)}>{t(severityKey(severity))}</span>
          <span style={{ fontSize: ".68rem", color: MUTED }}>{rows.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{rows.map((r) => <DepSection key={r.dep} ev={ev} row={r} />)}</div>
      </div>
    );
  };

  return (
    <Panel
      title={t("rebuild.title")}
      onClose={p.onClose}
      style={{ right: 16, top: 96, width: 384, maxWidth: "calc(100vw - 32px)", maxHeight: "76vh", overflowY: "auto" }}
    >
      {/* quick-access bar: alert wave + ghost controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid var(--line)" }}>
        <IconBtn on={prefs.alertWaves} label="〜" onClick={() => onSetPrefs({ alertWaves: !prefs.alertWaves })} />
        <span style={{ fontSize: ".68rem", color: MUTED }}>{t("rebuild.ctl.intensity")}</span>
        <IconBtn label="−" onClick={() => onSetPrefs({ alertWaveIntensity: clamp(prefs.alertWaveIntensity - 1) })} />
        <IconBtn label="+" onClick={() => onSetPrefs({ alertWaveIntensity: clamp(prefs.alertWaveIntensity + 1) })} />
        <span style={{ fontSize: ".68rem", color: MUTED }}>{t("rebuild.ctl.speed")}</span>
        <IconBtn label="−" onClick={() => onSetPrefs({ alertWaveSpeed: clamp(prefs.alertWaveSpeed - 1) })} />
        <IconBtn label="+" onClick={() => onSetPrefs({ alertWaveSpeed: clamp(prefs.alertWaveSpeed + 1) })} />
        <span style={{ flex: 1 }} />
        <IconBtn on={prefs.alertGhosts} label="⇢" onClick={() => onSetPrefs({ alertGhosts: !prefs.alertGhosts })} />
      </div>

      {alerts.length === 0 ? (
        <div style={{ fontSize: ".82rem", color: MUTED }}>{t("rebuild.empty")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: ".76rem", color: MUTED, lineHeight: 1.5 }}>{t("rebuild.intro")}</div>
          {/* global scope */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <Button onClick={p.onReconnectAll} title={t("rebuild.reconnectAll.tip")}>{t("rebuild.reconnectAll")}</Button>
            <Button variant="ghost" onClick={p.onDismissAll} title={t("rebuild.dismissAll.tip")}>{t("rebuild.dismissAll")}</Button>
          </div>
          {alerts.map((ev) => {
            const { orphan, partial } = eventRows(ev);
            const isCollapsed = collapsed.includes(ev.id);
            return (
              <div key={ev.id} style={{ border: "1px solid var(--line)", borderRadius: 9, padding: "8px 10px" }}>
                <div onClick={() => onToggleCollapse(ev.id)} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, cursor: "pointer" }}>
                  <strong style={{ fontSize: ".82rem" }}>
                    <span style={{ color: MUTED, marginRight: 5 }}>{isCollapsed ? "▸" : "▾"}</span>
                    {t("rebuild.removed", { name: ev.removedLabel })}
                  </strong>
                  <span style={{ fontSize: ".68rem", color: MUTED }}>{new Date(ev.at).toLocaleString()}</span>
                </div>
                {!isCollapsed && (
                  <>
                    <div style={{ marginTop: 8 }}>
                      <Section ev={ev} severity="orphan" rows={orphan} />
                      <Section ev={ev} severity="partial" rows={partial} />
                    </div>
                    {/* event scope */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 6 }}>
                      {ev.pairs.length > 0 && <Button onClick={() => p.onReconnectEvent(ev.id)} title={t("rebuild.reconnectEvent.tip")}>{t("rebuild.reconnectEvent")}</Button>}
                      <Button variant="ghost" onClick={() => p.onDismissEvent(ev.id)} title={t("rebuild.dismissEvent.tip")}>{t("rebuild.dismissEvent")}</Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
