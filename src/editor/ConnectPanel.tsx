import { useMemo, useState } from "react";
import { Panel, Button, Field, Combobox } from "./ui/primitives";
import { MUTED } from "./theme";
import type { GraphNode, Section } from "../core/types";

export type Direction = "from-dep-to" | "to-dep-from" | "comment";

export interface ConnectPanelProps {
  fromNode: GraphNode;
  nodes: GraphNode[];
  sections: Section[];
  onCreate: (targetId: string, direction: Direction) => void;
  onClose: () => void;
  /** When set, the panel retargets one end of an existing edge instead of
   *  creating a new one: the direction is fixed (hidden) and `fromNode` is the
   *  end that stays, so the picker chooses the node for the moving end. */
  lock?: { fixedLabel: string };
}

/** Reliable, button-driven edge creation: pick direction, section (filterable,
 *  with "All sections"), then the target node of that section. Reused in a
 *  locked mode to retarget one end of an edge (N-25). */
export function ConnectPanel({ fromNode, nodes, sections, onCreate, onClose, lock }: ConnectPanelProps) {
  const [section, setSection] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const [direction, setDirection] = useState<Direction>("to-dep-from");

  const sectionOptions = useMemo(
    () => [{ value: "", label: "All sections" }, ...sections.map((s) => ({ value: s.id, label: s.label }))],
    [sections],
  );
  const nodeOptions = useMemo(
    () =>
      nodes
        .filter((n) => n.kind !== "section" && n.id !== fromNode.id && (!section || n.sectionId === section))
        .map((n) => ({ value: n.id, label: n.label })),
    [nodes, fromNode.id, section],
  );

  const fromLabel = fromNode.label;
  const targetLabel = nodes.find((n) => n.id === target)?.label ?? "target";

  return (
    <Panel title={lock ? "Retarget end" : "Connect node"} onClose={onClose} style={{ left: "50%", top: "32%", transform: "translateX(-50%)", minWidth: 300 }}>
      <div style={{ fontSize: ".8rem", color: MUTED, marginBottom: 8 }}>
        {lock ? (
          <>Keep <b style={{ color: "var(--ink)" }}>{lock.fixedLabel}</b> fixed, move the other end</>
        ) : (
          <>From <b style={{ color: "var(--ink)" }}>{fromLabel}</b></>
        )}
      </div>

      <Field label="Section">
        <div style={{ width: 170 }}>
          <Combobox value={section} options={sectionOptions} onChange={(v) => { setSection(v); setTarget(""); }} placeholder="All sections" />
        </div>
      </Field>
      <Field label={lock ? "New node" : "Target node"}>
        <div style={{ width: 170 }}>
          <Combobox value={target} options={nodeOptions} onChange={setTarget} placeholder="Pick a node…" />
        </div>
      </Field>

      {!lock && (
        <>
          <div style={{ margin: "10px 0 4px", fontSize: ".72rem", color: MUTED, textTransform: "uppercase", letterSpacing: ".04em" }}>Direction</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: ".82rem" }}>
              <input type="radio" checked={direction === "to-dep-from"} onChange={() => setDirection("to-dep-from")} />
              <span><b>{fromLabel}</b> depends on <b>{targetLabel}</b></span>
            </label>
            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: ".82rem" }}>
              <input type="radio" checked={direction === "from-dep-to"} onChange={() => setDirection("from-dep-to")} />
              <span><b>{targetLabel}</b> depends on <b>{fromLabel}</b></span>
            </label>
            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: ".82rem" }}>
              <input type="radio" checked={direction === "comment"} onChange={() => setDirection("comment")} />
              <span>Comment link (no dependency)</span>
            </label>
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 12 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => target && onCreate(target, direction)}>{lock ? "Retarget" : "Create"}</Button>
      </div>
    </Panel>
  );
}
