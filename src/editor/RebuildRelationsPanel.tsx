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
  onDiscardPair: (eventId: string, pair: { source: string; target: string }) => void;
  onUnlink: (eventId: string, nodeId: string) => void;
  onReconnectAll: (eventId: string) => void;
  onResolveEvent: (eventId: string) => void;
  onLocate: (nodeId: string) => void;
  onClose: () => void;
}

type Row =
  | { kind: "pair"; pair: { source: string; target: string }; severity: AlertSeverity }
  | { kind: "lonely"; nodeId: string; severity: AlertSeverity };

const worse = (a: AlertSeverity, b?: AlertSeverity): AlertSeverity => (a === "orphan" || b === "orphan" ? "orphan" : "partial");

/** Split one event's pairs and lone nodes into rows tagged by severity (the worst
 *  of a pair's affected endpoints). */
function eventRows(ev: BreakEvent): { orphan: Row[]; partial: Row[] } {
  const rows: Row[] = [];
  for (const p of ev.pairs) {
    const sevs = [p.source, p.target].map((id) => ev.info[id]?.severity).filter(Boolean) as AlertSeverity[];
    rows.push({ kind: "pair", pair: p, severity: sevs.reduce((acc, s) => worse(acc, s), "partial" as AlertSeverity) });
  }
  for (const id of ev.lonely) rows.push({ kind: "lonely", nodeId: id, severity: ev.info[id]?.severity ?? "partial" });
  return { orphan: rows.filter((r) => r.severity === "orphan"), partial: rows.filter((r) => r.severity === "partial") };
}

/** The focused "Rebuild relations" mode (N-44): one card per deletion event, its
 *  broken links split into Orphaned and Partial sections. Reconnect or discard
 *  each bridge, reconnect them all, unlink a lone node, or dismiss the event. A
 *  node name locates it on the canvas; Alt and hover a bridge shows what it
 *  replaces. Dotted ghost previews are drawn on the canvas while this is open. */
export function RebuildRelationsPanel({ alerts, labelOf, onReconnectPair, onDiscardPair, onUnlink, onReconnectAll, onResolveEvent, onLocate, onClose }: RebuildRelationsPanelProps) {
  const [alt, setAlt] = useState(false);
  const [hint, setHint] = useState<{ x: number; y: number; text: string } | null>(null);
  const altRef = useRef(false);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (e.key === "Alt") { altRef.current = true; setAlt(true); } };
    const ku = (e: KeyboardEvent) => { if (e.key === "Alt") { altRef.current = false; setAlt(false); setHint(null); } };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  const NameBtn = ({ id }: { id: string }) => (
    <button onClick={() => onLocate(id)} title={t("rebuild.locate.tip")} style={nameBtn}>{labelOf(id)}</button>
  );

  const PairRow = ({ ev, pair, removed }: { ev: BreakEvent; pair: { source: string; target: string }; removed: string }) => (
    <div
      style={rowBox}
      onMouseMove={(e) => { if (altRef.current) setHint({ x: e.clientX, y: e.clientY, text: t("rebuild.preview", { a: labelOf(pair.source), x: removed, b: labelOf(pair.target) }) }); }}
      onMouseLeave={() => setHint(null)}
    >
      <span style={{ fontSize: ".8rem", minWidth: 0 }}>
        <NameBtn id={pair.source} />
        <span style={{ color: MUTED }}> {t("delete.dependsArrow")} </span>
        <NameBtn id={pair.target} />
      </span>
      <span style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <Button onClick={() => onReconnectPair(ev.id, pair)} title={t("rebuild.reconnect.tip")}>{t("rebuild.reconnect")}</Button>
        <Button variant="ghost" onClick={() => onDiscardPair(ev.id, pair)} title={t("rebuild.discard.tip")}>{t("rebuild.discard")}</Button>
      </span>
    </div>
  );

  const LonelyRow = ({ ev, id }: { ev: BreakEvent; id: string }) => (
    <div style={rowBox}>
      <span style={{ fontSize: ".8rem", minWidth: 0 }}><NameBtn id={id} /></span>
      <Button variant="ghost" onClick={() => onUnlink(ev.id, id)} title={t("rebuild.unlink.tip")}>{t("rebuild.unlink")}</Button>
    </div>
  );

  const Section = ({ ev, severity, rows }: { ev: BreakEvent; severity: AlertSeverity; rows: Row[] }) => {
    if (rows.length === 0) return null;
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0 4px" }}>
          <span style={severityChip(severity)}>{t(severityKey(severity))}</span>
          <span style={{ fontSize: ".68rem", color: MUTED }}>{rows.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {rows.map((r, i) =>
            r.kind === "pair"
              ? <PairRow key={`p${i}`} ev={ev} pair={r.pair} removed={ev.removedLabel} />
              : <LonelyRow key={`l${i}`} ev={ev} id={r.nodeId} />,
          )}
        </div>
      </div>
    );
  };

  return (
    <Panel
      title={t("rebuild.title")}
      onClose={onClose}
      style={{ right: 16, top: 96, width: 360, maxWidth: "calc(100vw - 32px)", maxHeight: "72vh", overflowY: "auto" }}
    >
      {alerts.length === 0 ? (
        <div style={{ fontSize: ".82rem", color: MUTED }}>{t("rebuild.empty")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: ".76rem", color: MUTED, lineHeight: 1.5 }}>{t("rebuild.intro")} {alt ? "" : t("rebuild.altHint")}</div>
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
                  {ev.pairs.length > 1 && (
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
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "5px 7px",
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
