import type { CSSProperties } from "react";
import type { AlertSeverity } from "./api";

/** Shared severity palette for the broken-link alert (N-44), so the delete
 *  dialog and the Rebuild relations panel read the same: orphaned in the ghost
 *  red, partial in the amber "down" color. Theme-aware via CSS variables. */
export function severityChip(severity: AlertSeverity): CSSProperties {
  const color = severity === "orphan" ? "var(--ghost)" : "var(--down)";
  return {
    color,
    background: `color-mix(in srgb, ${color} 16%, transparent)`,
    fontSize: ".68rem",
    padding: "1px 6px",
    borderRadius: 5,
    whiteSpace: "nowrap",
  };
}

/** i18n key for a severity label. */
export function severityKey(severity: AlertSeverity): string {
  return severity === "orphan" ? "alert.severity.orphan" : "alert.severity.partial";
}
