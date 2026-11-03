import { Panel, Button, Field } from "./ui/primitives";
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
  onDelete: (id: string) => void;
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

export function NodeOverlay({ node, at, sections, connected, onClose, onOpen, onSetSection, onAddComment, onDelete }: NodeOverlayProps) {
  const isSection = node.kind === "section";
  const isComment = node.kind === "comment";
  const x = Math.min(at.x + 12, window.innerWidth - 330);
  const y = Math.min(at.y + 12, window.innerHeight - 220);

  return (
    <Panel title={node.label} onClose={onClose} style={{ left: x, top: y }}>
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

      {/* section reassignment */}
      {!isSection && (
        <Field label="Section">
          <select
            value={node.sectionId ?? ""}
            onChange={(e) => onSetSection(node.id, e.target.value)}
            style={{ font: "inherit", fontSize: ".8rem", padding: "3px 6px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)" }}
          >
            <option value="">— none —</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* actions */}
      {!isSection && (
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
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
