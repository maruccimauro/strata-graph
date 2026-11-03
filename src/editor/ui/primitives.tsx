import type { ReactNode, CSSProperties } from "react";
import { PANEL, INK, MUTED } from "../theme";

/** Shared button. `variant`: default | primary | ghost. */
export function Button({
  children,
  onClick,
  title,
  variant = "default",
  active,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  variant?: "default" | "primary" | "ghost";
  active?: boolean;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    font: "inherit",
    fontSize: ".82rem",
    cursor: "pointer",
    border: "1px solid var(--line)",
    background: variant === "primary" ? "var(--accent, #0a7d7d)" : variant === "ghost" ? "transparent" : PANEL,
    color: variant === "primary" ? "#fff" : INK,
    borderColor: variant === "ghost" ? "transparent" : active ? "var(--accent, #0a7d7d)" : "var(--line)",
    borderRadius: 8,
    padding: "5px 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    whiteSpace: "nowrap",
    ...style,
  };
  return (
    <button title={title} onClick={onClick} style={base}>
      {children}
    </button>
  );
}

/** Reusable floating panel — the single shape for every config / overlay. */
export function Panel({
  title,
  onClose,
  children,
  style,
  actions,
}: {
  title?: string;
  onClose?: () => void;
  children: ReactNode;
  style?: CSSProperties;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        background: PANEL,
        color: INK,
        border: "1px solid var(--line)",
        borderRadius: 11,
        boxShadow: "0 12px 34px rgba(0,0,0,.30)",
        zIndex: 60,
        minWidth: 230,
        maxWidth: 360,
        ...style,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {(title !== undefined || onClose) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "8px 11px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <strong style={{ fontSize: ".84rem" }}>{title}</strong>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {actions}
            {onClose && (
              <button
                onClick={onClose}
                title="Close (Esc)"
                style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: ".9rem" }}
              >
                ✕
              </button>
            )}
          </span>
        </div>
      )}
      <div style={{ padding: "10px 12px" }}>{children}</div>
    </div>
  );
}

/** Labeled row for config panels. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "7px 0", fontSize: ".82rem" }}>
      <span style={{ color: MUTED }}>{label}</span>
      {children}
    </label>
  );
}
