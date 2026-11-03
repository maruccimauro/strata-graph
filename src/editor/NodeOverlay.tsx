import { useEffect, useRef } from "react";
import { Panel, Button, Field, Combobox } from "./ui/primitives";
import { MUTED } from "./theme";
import type { GraphNode, Section } from "../core/types";

export interface NodeOverlayProps {
  node: GraphNode;
  at: { x: number; y: number };
  sections: Section[];
  connected: boolean;
  onClose: () => void;
  onOpen: (path: string, kind: "file" | "folder") => void;
  onSetSection: (id: string, sectionId: string) => void;
  onAddComment: (nodeId: string) => void;
  onConnectPanel: (node: GraphNode) => void;
  onDelete: (id: string) => void;
}

/** Auto-dismiss: closes when the pointer never enters the panel and drifts
 *  >20px away, or once it has entered and then left. */
function useHoverDismiss(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    let entered = false;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (inside) { entered = true; return; }
      if (entered) { onClose(); return; }
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      if (Math.hypot(dx, dy) > 20) onClose();
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [ref, onClose]);
}

function Flag({ text, tone }: { text: string; tone: "auto" | "manual" | "gen" | "miss" | "comment" }) {
  const map = {
    auto: ["#1b6ea8", "rgba(27,110,168,.15)"],
    manual: ["#6b3fa0", "rgba(107,63,160,.15)"],
    gen: ["#1f8a4c", "rgba(31,138,76,.15)"],
    miss: ["var(--ghost)", "rgba(192,57,43,.15)"],
    comment: ["#8a6d0a", "rgba(202,168,58,.2)"],
  } as const;
  const [fg, bg] = map[tone];
  return (
    <span style={{ fontSize: ".66rem", fontWeight: 700, padding: "2px 7px", borderRadius: 6, color: fg, background: bg, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

export function NodeOverlay({ node, at, sections, connected, onClose, onOpen, onSetSection, onAddComment, onConnectPanel, onDelete }: NodeOverlayProps) {
  const isSection = node.kind === "section";
  const isComment = node.kind === "comment";
  const x = Math.min(at.x + 12, window.innerWidth - 330);
  const y = Math.min(at.y + 12, window.innerHeight - 240);
  const ref = useRef<HTMLDivElement>(null);
  useHoverDismiss(ref, onClose);

  return (
    <Panel title={node.label} onClose={onClose} style={{ left: x, top: y }} innerRef={ref}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {isComment ? (
          <Flag text="🏷️ Comment" tone="comment" />
        ) : (
          <>
            <Flag text={node.origin === "manual" ? "✎ Manual" : "⚙ Automatic"} tone={node.origin === "manual" ? "manual" : "auto"} />
            {!isSection &&
              (node.status === "missing" ? <Flag text="Not generated" tone="miss" /> : <Flag text="Generated" tone="gen" />)}
          </>
        )}
      </div>

      {isComment && node.note && <div style={{ fontSize: ".82rem", marginBottom: 8 }}>{node.note}</div>}

      {/* associated files */}
      {node.files && node.files.length > 0 && (
        <div style={{ margin: "4px 0 8px" }}>
          {node.files.map((f) => (
            <div key={f.path} style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0" }}>
              <span style={{ fontSize: ".76rem", color: MUTED, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.path}
              </span>
              {connected && (
                <>
                  <Button variant="ghost" title="Open file" onClick={() => onOpen(f.path, "file")}>📄</Button>
                  <Button variant="ghost" title="Open folder" onClick={() => onOpen(f.path, "folder")}>📁</Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {!isComment && connected && (!node.files || node.files.length === 0) && (
        <div style={{ fontSize: ".76rem", color: MUTED, margin: "2px 0 8px" }}>No file associated.</div>
      )}

      {/* section reassignment (filterable) */}
      {!isSection && (
        <Field label="Section">
          <div style={{ width: 150 }}>
            <Combobox
              value={node.sectionId ?? ""}
              options={[{ value: "", label: "— none —" }, ...sections.map((s) => ({ value: s.id, label: s.label }))]}
              onChange={(v) => onSetSection(node.id, v)}
              placeholder="Section…"
            />
          </div>
        </Field>
      )}

      {/* actions */}
      {!isSection && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <Button onClick={() => onConnectPanel(node)}>🔗 Connect…</Button>
          <Button onClick={() => onAddComment(node.id)}>🏷️ Comment</Button>
          {node.origin === "manual" && (
            <Button variant="ghost" style={{ color: "var(--ghost)" }} onClick={() => onDelete(node.id)}>
              🗑 Delete
            </Button>
          )}
        </div>
      )}
    </Panel>
  );
}
