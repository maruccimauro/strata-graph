import { Button } from "./ui/primitives";
import { t } from "./i18n";
import type { BreakEvent } from "./api";

export interface RelationAlertBannerProps {
  events: BreakEvent[];
  onRebuild: () => void;
  onHide: (eventId: string) => void;
}

/** Count of neighbors still affected by one event (pending pairs + lone nodes). */
function affectedCount(ev: BreakEvent): number {
  const ids = new Set<string>([...ev.lonely, ...ev.pairs.flatMap((p) => [p.source, p.target])]);
  return ids.size;
}

/** Always-on alert banner over the viewer (N-44): one strip per deletion event
 *  whose banner is not hidden, each stating what broke and offering to rebuild
 *  relations or hide that strip (the nodes stay marked either way). */
export function RelationAlertBanner({ events, onRebuild, onHide }: RelationAlertBannerProps) {
  const shown = events.filter((e) => !e.hidden);
  if (shown.length === 0) return null;
  return (
    <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 6, zIndex: 50, maxWidth: "min(620px, 92vw)" }}>
      {shown.map((ev) => (
        <div
          key={ev.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "7px 12px",
            background: "var(--panel)",
            border: "1px solid var(--ghost)",
            borderLeft: "4px solid var(--ghost)",
            borderRadius: 10,
            boxShadow: "0 10px 28px rgba(0,0,0,.26)",
          }}
        >
          <span style={{ fontSize: "1rem", lineHeight: 1 }}>⛓️‍💥</span>
          <span style={{ fontSize: ".8rem", flex: 1, lineHeight: 1.4 }}>
            {t("alert.banner", { name: ev.removedLabel, count: affectedCount(ev) })}
          </span>
          <Button onClick={onRebuild} title={t("alert.rebuild.tip")}>{t("alert.rebuild")}</Button>
          <Button variant="ghost" onClick={() => onHide(ev.id)} title={t("alert.hide.tip")}>{t("alert.hide")}</Button>
        </div>
      ))}
    </div>
  );
}
