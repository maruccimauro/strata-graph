import { useEffect, useState } from "react";
import { Panel, Button, Field, Combobox } from "./ui/primitives";
import { MUTED } from "./theme";
import { t } from "./i18n";
import type { GraphNode, Section } from "../core/types";

export interface NodeOverlayProps {
  node: GraphNode;
  at: { x: number; y: number };
  sections: Section[];
  connected: boolean;
  onClose: () => void;
  onOpen: (path: string, kind: "file" | "folder") => void;
  onSetSection: (id: string, sectionId: string) => void;
  onSetNodeMeta: (id: string, meta: { createdAt?: number; dueAt?: number; locked?: boolean }) => void;
  onAddComment: (nodeId: string) => void;
  onConnectPanel: (node: GraphNode) => void;
  onManageEdges: (node: GraphNode) => void;
  onDelete: (id: string) => void;
  /** whether this node is under a relational-integrity alert (N-44). */
  alerted?: boolean;
  /** clear this node from every alert it is part of (mark resolved on purpose). */
  onUnlinkAlert: (id: string) => void;
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

/** Icon-only action for the overlay action bar (tooltip carries the label/shortcut). */
function IconAction({ icon, title, onClick, danger }: { icon: string; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        border: "1px solid var(--line)",
        background: "var(--panel)",
        color: danger ? "var(--ghost)" : "var(--ink)",
        borderRadius: 7,
        width: 30,
        height: 28,
        cursor: "pointer",
        fontSize: ".9rem",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </button>
  );
}

/** epoch ms -> value for <input type="datetime-local"> in the viewer's local time. */
function toLocalInput(ms?: number): string {
  if (!ms) return "";
  return new Date(ms - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string): number | undefined {
  if (!v) return undefined;
  const ms = new Date(v).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

function formatCountdown(ms: number): string {
  const neg = ms < 0;
  let s = Math.floor(Math.abs(ms) / 1000);
  const y = Math.floor(s / (365 * 86400)); s -= y * 365 * 86400;
  const mo = Math.floor(s / (30 * 86400)); s -= mo * 30 * 86400;
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const parts: string[] = [];
  if (y) parts.push(`${y}y`);
  if (y || mo) parts.push(`${mo}mo`);
  if (y || mo || d) parts.push(`${d}d`);
  parts.push(`${h}h`, `${m}m`, `${s}s`);
  return (neg ? "-" : "") + parts.join(" ");
}

/** Live countdown to the due date; red and negative once overdue. */
function Countdown({ dueAt }: { dueAt: number }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const left = dueAt - Date.now();
  const overdue = left < 0;
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: overdue ? "var(--ghost)" : "var(--ink)" }}>
      {formatCountdown(left)}{" "}{overdue ? t("countdown.overdue") : t("countdown.left")}
    </span>
  );
}

export function NodeOverlay({ node, at, sections, connected, onClose, onOpen, onSetSection, onSetNodeMeta, onAddComment, onConnectPanel, onManageEdges, onDelete, alerted, onUnlinkAlert }: NodeOverlayProps) {
  const isSection = node.kind === "section";
  const isComment = node.kind === "comment";
  const x = Math.min(at.x + 12, window.innerWidth - 330);
  const y = Math.min(at.y + 12, window.innerHeight - 300);

  return (
    <Panel title={node.label} onClose={onClose} style={{ left: x, top: y }}>
      {/* action bar — icon buttons, below the title, above the flags row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
        <IconAction
          icon={node.locked ? "🔒" : "🔓"}
          title={node.locked ? t("overlay.unlock.tip") : t("overlay.lock.tip")}
          onClick={() => onSetNodeMeta(node.id, { locked: !node.locked })}
        />
        {!isSection && <IconAction icon="🔗" title={t("overlay.connect.tip")} onClick={() => onConnectPanel(node)} />}
        {!isSection && <IconAction icon="⛓" title={t("overlay.edges.tip")} onClick={() => onManageEdges(node)} />}
        {!isSection && <IconAction icon="🏷️" title={t("overlay.comment.tip")} onClick={() => onAddComment(node.id)} />}
        {alerted && <IconAction icon="✔" title={t("alert.unlink.tip")} onClick={() => onUnlinkAlert(node.id)} />}
        {!isSection && <IconAction icon="🗑" title={t("overlay.delete.tip")} danger onClick={() => onDelete(node.id)} />}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {isComment ? (
          <Flag text={t("flag.comment")} tone="comment" />
        ) : (
          <>
            <Flag text={node.origin === "manual" ? t("flag.manual") : t("flag.auto")} tone={node.origin === "manual" ? "manual" : "auto"} />
            {!isSection &&
              (node.status === "missing" ? <Flag text={t("flag.notGenerated")} tone="miss" /> : <Flag text={t("flag.generated")} tone="gen" />)}
          </>
        )}
        {node.locked && <Flag text={t("flag.locked")} tone="manual" />}
        {alerted && <Flag text={t("flag.alert")} tone="miss" />}
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
                  <Button variant="ghost" title={t("file.open")} onClick={() => onOpen(f.path, "file")}>📄</Button>
                  <Button variant="ghost" title={t("folder.open")} onClick={() => onOpen(f.path, "folder")}>📁</Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {!isComment && connected && (!node.files || node.files.length === 0) && (
        <div style={{ fontSize: ".76rem", color: MUTED, margin: "2px 0 8px" }}>{t("file.none")}</div>
      )}

      {/* section reassignment (filterable) */}
      {!isSection && (
        <Field label={t("overlay.section")}>
          <div style={{ width: 150 }}>
            <Combobox
              value={node.sectionId ?? ""}
              options={[{ value: "", label: t("overlay.sectionNone") }, ...sections.map((s) => ({ value: s.id, label: s.label }))]}
              onChange={(v) => onSetSection(node.id, v)}
              placeholder={t("overlay.sectionPh")}
            />
          </div>
        </Field>
      )}

      {/* dates: creation (read-only) + due date with a live countdown */}
      <Field label={t("overlay.dueDate")}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="datetime-local"
            value={toLocalInput(node.dueAt)}
            onChange={(e) => onSetNodeMeta(node.id, { dueAt: fromLocalInput(e.target.value) })}
            style={{ font: "inherit", fontSize: ".78rem", padding: "3px 6px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)" }}
          />
          {node.dueAt && (
            <button
              onClick={() => onSetNodeMeta(node.id, { dueAt: undefined })}
              title={t("overlay.clearDue")}
              style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: ".9rem" }}
            >
              ✕
            </button>
          )}
        </div>
      </Field>
      {node.dueAt && (
        <div style={{ fontSize: ".78rem", margin: "2px 0 6px", textAlign: "right" }}>
          <Countdown dueAt={node.dueAt} />
        </div>
      )}
      {node.createdAt && (
        <div style={{ fontSize: ".72rem", color: MUTED, marginTop: 4 }}>
          {t("overlay.created", { date: new Date(node.createdAt).toLocaleString() })}
        </div>
      )}
    </Panel>
  );
}
