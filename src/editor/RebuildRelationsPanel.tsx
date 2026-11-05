import { Panel, Button } from "./ui/primitives";
import { MUTED } from "./theme";
import { t } from "./i18n";
import type { BreakEvent } from "./api";

export interface RebuildRelationsPanelProps {
  alerts: BreakEvent[];
  labelOf: (id: string) => string;
  onReconnectPair: (eventId: string, pair: { source: string; target: string }) => void;
  onDiscardPair: (eventId: string, pair: { source: string; target: string }) => void;
  onUnlink: (eventId: string, nodeId: string) => void;
  onReconnectAll: (eventId: string) => void;
  onResolveEvent: (eventId: string) => void;
  onClose: () => void;
}

const chip = (tone: "orphan" | "partial") => ({
  fontSize: ".68rem",
  padding: "1px 6px",
  borderRadius: 5,
  color: tone === "orphan" ? "var(--ghost)" : "#b06a10",
  background: tone === "orphan" ? "rgba(192,57,43,.14)" : "rgba(217,132,16,.16)",
  whiteSpace: "nowrap" as const,
});

/** The focused "Rebuild relations" mode (N-44): one card per deletion event with
 *  its pending prerequisite -> dependent bridges (reconnect / discard per pair,
 *  or reconnect them all) and the lone neighbors (unlink to clear on purpose).
 *  Dotted ghost previews of the bridges are drawn on the canvas while this is open. */
export function RebuildRelationsPanel({ alerts, labelOf, onReconnectPair, onDiscardPair, onUnlink, onReconnectAll, onResolveEvent, onClose }: RebuildRelationsPanelProps) {
  return (
    <Panel
      title={t("rebuild.title")}
      onClose={onClose}
      style={{ right: 16, top: 96, minWidth: 300, maxWidth: 380, maxHeight: "72vh", overflowY: "auto" }}
    >
      {alerts.length === 0 ? (
        <div style={{ fontSize: ".82rem", color: MUTED }}>{t("rebuild.empty")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: ".76rem", color: MUTED, lineHeight: 1.5 }}>{t("rebuild.intro")}</div>
          {alerts.map((ev) => (
            <div key={ev.id} style={{ border: "1px solid var(--line)", borderRadius: 9, padding: "8px 10px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                <strong style={{ fontSize: ".82rem" }}>{t("rebuild.removed", { name: ev.removedLabel })}</strong>
                <span style={{ fontSize: ".68rem", color: MUTED }}>{new Date(ev.at).toLocaleString()}</span>
              </div>

              {ev.pairs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                  {ev.pairs.map((p) => (
                    <div key={`${p.source}->${p.target}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: ".8rem" }}>
                        <b>{labelOf(p.source)}</b>
                        <span style={{ color: MUTED }}> {t("delete.dependsArrow")} </span>
                        <b>{labelOf(p.target)}</b>
                      </span>
                      <span style={{ display: "flex", gap: 5 }}>
                        <Button onClick={() => onReconnectPair(ev.id, p)} title={t("rebuild.reconnect.tip")}>{t("rebuild.reconnect")}</Button>
                        <Button variant="ghost" onClick={() => onDiscardPair(ev.id, p)} title={t("rebuild.discard.tip")}>{t("rebuild.discard")}</Button>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {ev.lonely.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
                  {ev.lonely.map((id) => (
                    <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: ".8rem", display: "flex", alignItems: "center", gap: 6 }}>
                        {labelOf(id)}
                        {ev.info[id] && <span style={chip(ev.info[id].severity)}>{t(ev.info[id].severity === "orphan" ? "alert.severity.orphan" : "alert.severity.partial")}</span>}
                      </span>
                      <Button variant="ghost" onClick={() => onUnlink(ev.id, id)} title={t("rebuild.unlink.tip")}>{t("rebuild.unlink")}</Button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 4 }}>
                {ev.pairs.length > 1 && (
                  <Button onClick={() => onReconnectAll(ev.id)} title={t("rebuild.reconnectAll.tip")}>{t("rebuild.reconnectAll")}</Button>
                )}
                <Button variant="ghost" onClick={() => onResolveEvent(ev.id)} title={t("rebuild.dismiss.tip")}>{t("rebuild.dismiss")}</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
