import { memo, type PointerEvent as ReactPointerEvt } from "react";
import type { NodeProps } from "@xyflow/react";
import { bandBg, accent } from "../theme";
import { t } from "../i18n";

export interface BandData {
  label: string;
  hue: number;
  /** start a drag-to-reorder of this band from its grip. */
  onGrip?: (e: ReactPointerEvt) => void;
  [key: string]: unknown;
}

/** A full-width colored strip behind a section's nodes. The strip itself is
 *  non-interactive; only the reorder grip next to the label takes pointer events. */
function BandNodeImpl({ data }: NodeProps) {
  const d = data as BandData;
  const col = accent(d.hue);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bandBg(d.hue),
        borderRadius: 14,
        pointerEvents: "none",
      }}
    >
      <div style={{ position: "absolute", left: 14, top: 8, display: "flex", alignItems: "center", gap: 6 }}>
        {d.onGrip && (
          <span
            onPointerDown={(e) => d.onGrip!(e)}
            title={t("band.reorder.drag")}
            aria-label={t("band.reorder.drag")}
            style={{ pointerEvents: "auto", cursor: "grab", color: col, fontSize: 13, lineHeight: 1, opacity: 0.75, touchAction: "none", userSelect: "none" }}
          >
            ⠿
          </span>
        )}
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: col,
          }}
        >
          {d.label}
        </span>
      </div>
    </div>
  );
}

export const BandNode = memo(BandNodeImpl);
