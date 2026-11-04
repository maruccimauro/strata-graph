import { useMemo, useState } from "react";
import { Panel, Button, Field, Combobox } from "./ui/primitives";
import { MUTED } from "./theme";
import { t } from "./i18n";
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
    () => [{ value: "", label: t("connect.allSections") }, ...sections.map((s) => ({ value: s.id, label: s.label }))],
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
    <Panel title={lock ? t("connect.retargetTitle") : t("connect.title")} onClose={onClose} style={{ left: "50%", top: "32%", transform: "translateX(-50%)", minWidth: 300 }}>
      <div style={{ fontSize: ".8rem", color: MUTED, marginBottom: 8 }}>
        {lock ? (
          <>{t("connect.keepFixed", { name: "\u0000" }).split("\u0000")[0]}<b style={{ color: "var(--ink)" }}>{lock.fixedLabel}</b>{t("connect.keepFixed", { name: "\u0000" }).split("\u0000")[1]}</>
        ) : (
          <>{t("connect.from", { name: "\u0000" }).split("\u0000")[0]}<b style={{ color: "var(--ink)" }}>{fromLabel}</b>{t("connect.from", { name: "\u0000" }).split("\u0000")[1]}</>
        )}
      </div>

      <Field label={t("connect.section")}>
        <div style={{ width: 170 }}>
          <Combobox value={section} options={sectionOptions} onChange={(v) => { setSection(v); setTarget(""); }} placeholder={t("connect.allSections")} />
        </div>
      </Field>
      <Field label={lock ? t("connect.newNode") : t("connect.target")}>
        <div style={{ width: 170 }}>
          <Combobox value={target} options={nodeOptions} onChange={setTarget} placeholder={t("connect.pickNode")} />
        </div>
      </Field>

      {!lock && (
        <>
          <div style={{ margin: "10px 0 4px", fontSize: ".72rem", color: MUTED, textTransform: "uppercase", letterSpacing: ".04em" }}>{t("connect.direction")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: ".82rem" }}>
              <input type="radio" checked={direction === "to-dep-from"} onChange={() => setDirection("to-dep-from")} />
              <span><b>{fromLabel}</b> {t("connect.dependsOnWord")} <b>{targetLabel}</b></span>
            </label>
            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: ".82rem" }}>
              <input type="radio" checked={direction === "from-dep-to"} onChange={() => setDirection("from-dep-to")} />
              <span><b>{targetLabel}</b> {t("connect.dependsOnWord")} <b>{fromLabel}</b></span>
            </label>
            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: ".82rem" }}>
              <input type="radio" checked={direction === "comment"} onChange={() => setDirection("comment")} />
              <span>{t("connect.comment")}</span>
            </label>
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 12 }}>
        <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="primary" onClick={() => target && onCreate(target, direction)}>{lock ? t("connect.retarget") : t("connect.create")}</Button>
      </div>
    </Panel>
  );
}
