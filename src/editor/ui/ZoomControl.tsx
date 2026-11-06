import { useState } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { INK, MUTED } from "../theme";
import { t } from "../i18n";

/** Zoom bounds, kept in sync with the `<ReactFlow>` minZoom/maxZoom props. */
export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 2;

const clamp = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/** Live zoom indicator with a numeric entry (N-38). Reads the viewport zoom so it
 *  reflects wheel/pinch zoom too, and writes it back through `zoomTo`. Rendered in
 *  the quick bar; isolated so only this control re-renders as the viewport changes. */
export function ZoomControl() {
  const { zoom } = useViewport();
  const rf = useReactFlow();
  const [draft, setDraft] = useState<string | null>(null);

  const pct = Math.round(zoom * 100);
  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    setDraft(null);
    if (!Number.isFinite(n)) return;
    rf.zoomTo(clamp(n / 100), { duration: 150 });
  };

  const btn: React.CSSProperties = {
    border: "1px solid var(--line)",
    background: "transparent",
    color: INK,
    cursor: "pointer",
    width: 22,
    height: 24,
    borderRadius: 6,
    fontSize: ".9rem",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      title={t("tip.zoom")}
      style={{ display: "inline-flex", alignItems: "center", gap: 3 }}
    >
      <button style={btn} onClick={() => rf.zoomTo(clamp(zoom - 0.1), { duration: 120 })} aria-label={t("zoom.out")}>
        −
      </button>
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <input
          value={draft ?? String(pct)}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onFocus={(e) => { setDraft(String(pct)); e.currentTarget.select(); }}
          onBlur={(e) => commit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            else if (e.key === "Escape") { setDraft(null); e.currentTarget.blur(); }
          }}
          inputMode="numeric"
          style={{
            width: 36,
            textAlign: "right",
            border: "1px solid var(--line)",
            background: "transparent",
            color: INK,
            borderRadius: 6,
            padding: "3px 14px 3px 4px",
            fontSize: ".78rem",
            height: 24,
          }}
        />
        <span style={{ position: "absolute", right: 5, color: MUTED, fontSize: ".72rem", pointerEvents: "none" }}>%</span>
      </div>
      <button style={btn} onClick={() => rf.zoomTo(clamp(zoom + 0.1), { duration: 120 })} aria-label={t("zoom.in")}>
        ＋
      </button>
    </div>
  );
}
