import { useState, type ReactNode, type CSSProperties, type Ref } from "react";
import { PANEL, INK, MUTED } from "../theme";

/** Shared button. `variant`: default | primary | ghost | danger. */
export function Button({
  children,
  onClick,
  title,
  variant = "default",
  active,
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  variant?: "default" | "primary" | "ghost" | "danger";
  active?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    font: "inherit",
    fontSize: ".82rem",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    border: "1px solid var(--line)",
    background: variant === "primary" ? "var(--accent, #0a7d7d)" : variant === "danger" ? "#c0392b" : variant === "ghost" ? "transparent" : PANEL,
    color: variant === "primary" || variant === "danger" ? "#fff" : INK,
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
    <button title={title} onClick={onClick} disabled={disabled} style={base}>
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
  innerRef,
}: {
  title?: string;
  onClose?: () => void;
  children: ReactNode;
  style?: CSSProperties;
  actions?: ReactNode;
  innerRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={innerRef}
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

const inputStyle: CSSProperties = {
  font: "inherit",
  fontSize: ".82rem",
  padding: "5px 8px",
  borderRadius: 6,
  border: "1px solid var(--line)",
  background: "var(--panel)",
  color: "var(--ink)",
  width: "100%",
};

/** Filterable select: type to filter, click to choose. */
export function Combobox({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const sel = options.find((o) => o.value === value);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ position: "relative" }}>
      <input
        value={open ? q : (sel?.label ?? "")}
        placeholder={placeholder}
        onFocus={() => { setOpen(true); setQ(""); }}
        onChange={(e) => setQ(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 130)}
        style={inputStyle}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 2,
            maxHeight: 200,
            overflowY: "auto",
            background: PANEL,
            border: "1px solid var(--line)",
            borderRadius: 7,
            boxShadow: "0 10px 24px rgba(0,0,0,.26)",
            zIndex: 80,
          }}
        >
          {filtered.map((o) => (
            <div
              key={o.value}
              onMouseDown={() => { onChange(o.value); setOpen(false); }}
              style={{ padding: "6px 9px", fontSize: ".82rem", cursor: "pointer", color: o.value === value ? "var(--accent)" : INK }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(127,127,127,.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {o.label}
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: "6px 9px", fontSize: ".8rem", color: MUTED }}>No matches</div>}
        </div>
      )}
    </div>
  );
}

/** Labeled row for config panels. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "7px 0", fontSize: ".82rem" }}>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ color: MUTED }}>{label}</span>
        {hint && <span style={{ color: MUTED, opacity: 0.7, fontSize: ".72rem" }}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}
