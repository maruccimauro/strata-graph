import { useState, useRef, useEffect, type ReactNode, type CSSProperties, type Ref, type MouseEvent } from "react";
import { createPortal } from "react-dom";
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
  onClick?: (e?: MouseEvent<HTMLButtonElement>) => void;
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

/** A single key rendered as a keycap, the `<kbd>` form used across the UI and the
 *  wiki (see the keyboard-notation rule). Keys keep their natural capitalization. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      style={{
        display: "inline-block",
        minWidth: "1.1em",
        padding: "0 5px",
        borderRadius: 4,
        border: "1px solid var(--line)",
        borderBottomWidth: 2,
        background: "color-mix(in srgb, var(--muted) 8%, var(--panel))",
        color: MUTED,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: ".72em",
        lineHeight: 1.5,
        textAlign: "center",
      }}
    >
      {children}
    </kbd>
  );
}

/** A keyboard shortcut rendered as keycaps. `keys` is a plain combination such as
 *  "Ctrl+Z" or "N"; each key becomes a `<kbd>` joined by a literal plus. */
export function Shortcut({ keys }: { keys: string }) {
  const parts = keys.split("+").map((k) => k.trim());
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {parts.map((k, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          {i > 0 && <span style={{ color: MUTED, fontSize: ".72em" }}>+</span>}
          <Kbd>{k}</Kbd>
        </span>
      ))}
    </span>
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
  const inputRef = useRef<HTMLInputElement>(null);
  // Bump to recompute the dropdown's anchored position on scroll / resize so it
  // stays glued to the input even when an ancestor scrolls.
  const [, setTick] = useState(0);
  const sel = options.find((o) => o.value === value);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const reposition = () => setTick((n) => n + 1);
    // capture so scroll of any ancestor container is caught, not just the window.
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  // The dropdown renders in a portal with fixed positioning so it is never clipped
  // by an ancestor with `overflow` (e.g. the migration node list). Anchored to the
  // input's current bounding box.
  const rect = open ? inputRef.current?.getBoundingClientRect() : undefined;

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={open ? q : (sel?.label ?? "")}
        placeholder={placeholder}
        onFocus={() => { setOpen(true); setQ(""); }}
        onChange={(e) => setQ(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 130)}
        style={inputStyle}
      />
      {open && rect && createPortal(
        <div
          style={{
            position: "fixed",
            top: rect.bottom + 2,
            left: rect.left,
            width: rect.width,
            maxHeight: 200,
            overflowY: "auto",
            background: PANEL,
            border: "1px solid var(--line)",
            borderRadius: 7,
            boxShadow: "0 10px 24px rgba(0,0,0,.26)",
            zIndex: 1000,
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
        </div>,
        document.body,
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
