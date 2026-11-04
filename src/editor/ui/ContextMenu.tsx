import { useEffect, useRef } from "react";
import { PANEL, INK, MUTED } from "../theme";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  /** when set, renders a checkbox glyph (a toggle item). */
  checked?: boolean;
  danger?: boolean;
  disabled?: boolean;
  /** render a divider instead of an item (label/onClick ignored). */
  separator?: boolean;
}

/** Lightweight right-click menu positioned at (x, y). Closes on an outside
 *  pointer press, Escape, or after an item runs. Kept within the viewport.
 *  Reused for the pane, node and edge context menus. */
export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // swallow so the editor's staged Escape does not also fire
        e.stopPropagation();
        onClose();
      }
    };
    // capture phase so this runs before React Flow / editor handlers
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  const rows = items.length;
  const left = Math.min(x, window.innerWidth - 210);
  const top = Math.min(y, window.innerHeight - (rows * 30 + 12));

  return (
    <div
      ref={ref}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left,
        top,
        minWidth: 186,
        background: PANEL,
        border: "1px solid var(--line)",
        borderRadius: 9,
        boxShadow: "0 12px 30px rgba(0,0,0,.28)",
        padding: 5,
        zIndex: 80,
      }}
    >
      {items.map((it, i) =>
        it.separator ? (
          <div key={i} style={{ height: 1, background: "var(--line)", margin: "5px 4px" }} />
        ) : (
          <button
            key={i}
            disabled={it.disabled}
            onClick={() => {
              if (it.disabled) return;
              onClose();
              it.onClick();
            }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              width: "100%",
              textAlign: "left",
              border: "none",
              background: "transparent",
              color: it.disabled ? MUTED : it.danger ? "var(--ghost)" : INK,
              cursor: it.disabled ? "default" : "pointer",
              padding: "6px 9px",
              borderRadius: 6,
              fontSize: ".82rem",
              opacity: it.disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => !it.disabled && (e.currentTarget.style.background = "rgba(127,127,127,.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span>{it.label}</span>
            {it.checked !== undefined && <span style={{ color: MUTED }}>{it.checked ? "☑" : "☐"}</span>}
          </button>
        ),
      )}
    </div>
  );
}
