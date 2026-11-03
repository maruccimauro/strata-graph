import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { bandBg, accent } from "../theme";

export interface BandData {
  label: string;
  hue: number;
  [key: string]: unknown;
}

/** A full-width colored strip behind a section's nodes. Non-interactive. */
function BandNodeImpl({ data }: NodeProps) {
  const d = data as BandData;
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
      <span
        style={{
          position: "absolute",
          left: 16,
          top: 10,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: accent(d.hue),
        }}
      >
        {d.label}
      </span>
    </div>
  );
}

export const BandNode = memo(BandNodeImpl);
