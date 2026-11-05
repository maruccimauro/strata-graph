import { useEffect, useRef, useState } from "react";
import { Panel, Button } from "./ui/primitives";
import { MUTED } from "./theme";
import { t } from "./i18n";
import { severityChip, severityKey } from "./alertStyle";
import type { BreakEvent, AlertSeverity } from "./api";

export interface RebuildRelationsPanelProps {
  alerts: BreakEvent[];
  labelOf: (id: string) => string;
  onReconnectPair: (eventId: string, pair: { source: string; target: string }) => void;
  onUnlink: (eventId: string, nodeId: string) => void;
  onReconnectAll: (eventId: string) => void;
  onResolveEvent: (eventId: string) => void;
  onLocate: (nodeId: string) => void;
  onClose: () => void;
}

/** One affected dependent with its reconnection options (prerequisites of the
 *  removed node it can reconnect to). */
interface Row {
  dep: string;
  options: string[];
  severity: AlertSeverity;
}

function eventRows(ev: BreakEvent): { orphan: Row[]; partial: Row[] } {
  const rows: Row[] = Object.keys(ev.info).map((dep) => ({
    dep,
    options: ev.pairs.filter((p) => p.target === dep).map((p) => p.source),
    severity: ev.info[dep]?.severity ?? "partial",
  }));
  return { orphan: rows.filter((r) => r.severity === "orphan"), partial: rows.filter((r) => r.severity === "partial") };
}

/** The focused "Rebuild relations" mode (N-44): one card per deletion event, its
 *  affected dependents split into Orphaned and Partial sections. Each dependent
 *  reconnects to one of the removed node's prerequisites or is unlinked; a name
 *  locates it on the canvas, and a reconnection shows what it replaces on
 *  [ALT + Mouse Hover]. Dotted ghost previews are drawn on the canvas while open. */
export function RebuildRelationsPanel({ alerts, labelOf, onReconnectPair, onUnlink, onReconnectAll, onResolveEvent, onLocate, onClose }: RebuildRelationsPanelProps) {
  const [hint, setHint] = useState<{ x: number; y: number; text: string } | null>(null);
  const altRef = useRef(false);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (e.key === "Alt") altRef.current = true; };
    const ku = (e: KeyboardEvent) => { if (e.key === "Alt") { altRef.current = false; setHint(null); } };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  const NameBtn = ({ id }: { id: string }) => (
    <button onClick={() => onLocate(id)} title={t("rebuild.locate.tip")} style={nameBtn}>{labelOf(id)}</button>
  );

  const DepRow = ({ ev, row }: { ev: BreakEvent; row: Row }) => (
    <div style={rowBox}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <NameBtn id={row.dep} />
        <span style={severityChip(row.severity)}>{t(severityKey(row.severity))}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
        {row.options.length > 0 ? (
          <>
            <span style={{ fontSize: ".72rem", color: MUTED }}>{t("rebuild.reconnectTo")}</span>
            {row.options.map((p) => (
              <Button
                key={p}
                onClick={() => onReconnectPair(ev.id, { source: p, target: row.dep })}
                title={t("rebuild.reconnect.tip")}
              >
                <span
                  onMouseMove={(e) => { if (altRef.current) setHint({ x: e.clientX, y: e.clientY, text: t("rebuild.preview", { a: labelOf(p), x: ev.removedLabel, b: labelOf(row.dep) }) }); }}
                  onMouseLeave={() => setHint(null)}
                >
                  {labelOf(p)}
                </span>
              </Button>
            ))}
          </>
        ) : (
          <span style={{ fontSize: ".72rem", color: MUTED }}>{t("rebuild.noOption")}</span>
        )}
        <span style={{ flex: 1 }} />
        <Button variant="ghost" onClick={() => onUnlink(ev.id, row.dep)} title={t("rebuild.unlink.tip")}>{t("rebuild.unlink")}</Button>
      </div>
    </div>
  );

  const Section = ({ ev, severity, rows }: { ev: BreakEvent; severity: AlertSeverity; rows: Row[] }) => {
    if (rows.length === 0) return null;
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0" }}>
          <span style={severityChip(severity)}>{t(severityKey(severity))}</span>
          <span style={{ fontSize: ".68rem", color: MUTED }}>{rows.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {rows.map((r) => <DepRow key={r.dep} ev={ev} row={r} />)}
        </div>
      </div>
    );
  };

  return (
    <Panel
      title={t("rebuild.title")}
      onClose={onClose}
      style={{ right: 16, top: 96, width: 370, maxWidth: "calc(100vw - 32px)", maxHeight: "72vh", overflowY: "auto" }}
    >
      {alerts.length === 0 ? (
        <div style={{ fontSize: ".82rem", color: MUTED }}>{t("rebuild.empty")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: ".76rem", color: MUTED, lineHeight: 1.5 }}>{t("rebuild.intro")} {t("rebuild.altHint")}</div>
          {alerts.map((ev) => {
            const { orphan, partial } = eventRows(ev);
            return (
              <div key={ev.id} style={{ border: "1px solid var(--line)", borderRadius: 9, padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <strong style={{ fontSize: ".82rem" }}>{t("rebuild.removed", { name: ev.removedLabel })}</strong>
                  <span style={{ fontSize: ".68rem", color: MUTED }}>{new Date(ev.at).toLocaleString()}</span>
                </div>
                <Section ev={ev} severity="orphan" rows={orphan} />
                <Section ev={ev} severity="partial" rows={partial} />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 6 }}>
                  {ev.pairs.length > 0 && (
                    <Button onClick={() => onReconnectAll(ev.id)} title={t("rebuild.reconnectAll.tip")}>{t("rebuild.reconnectAll")}</Button>
                  )}
                  <Button variant="ghost" onClick={() => onResolveEvent(ev.id)} title={t("rebuild.dismiss.tip")}>{t("rebuild.dismiss")}</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {hint && (
        <div style={{ position: "fixed", left: Math.min(hint.x + 14, window.innerWidth - 260), top: hint.y + 14, zIndex: 90, maxWidth: 250, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 8, boxShadow: "0 8px 22px rgba(0,0,0,.28)", padding: "7px 10px", fontSize: ".74rem", lineHeight: 1.5, pointerEvents: "none" }}>
          {hint.text}
        </div>
      )}
    </Panel>
  );
}

const rowBox = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 2,
  padding: "6px 8px",
  border: "1px solid var(--line)",
  borderRadius: 7,
  background: "color-mix(in srgb, var(--muted) 6%, transparent)",
};

const nameBtn = {
  border: "none",
  background: "transparent",
  color: "var(--accent)",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 600,
  padding: 0,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};
