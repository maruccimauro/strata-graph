import type { GraphModel, GraphNode, GraphEdge, Section } from "../../core/types";

/**
 * Generic task-board built-in Strata Graph Model. Unlike SDLC, it models no
 * lifecycle: sections are board columns and nodes are cards, with dependencies
 * between them. It exists to show the engine is domain agnostic and to give the
 * built-in picker a second, non-SDLC starting point.
 */
export const BOARD_BASE_ID = "board";

const COLUMNS: Section[] = [
  { id: "backlog", label: "Backlog", hue: 265, order: 0 },
  { id: "todo", label: "To do", hue: 205, order: 1 },
  { id: "in-progress", label: "In progress", hue: 158, order: 2 },
  { id: "review", label: "Review", hue: 45, order: 3 },
  { id: "done", label: "Done", hue: 95, order: 4 },
];

interface Card {
  id: string;
  column: string;
  label: string;
}

const CARDS: Card[] = [
  { id: "idea-dark-mode", column: "backlog", label: "Idea: dark mode" },
  { id: "idea-export", column: "backlog", label: "Idea: CSV export" },
  { id: "spec-dark-mode", column: "todo", label: "Spec: dark mode" },
  { id: "design-login", column: "todo", label: "Design: login screen" },
  { id: "build-login", column: "in-progress", label: "Build: login" },
  { id: "build-dark-mode", column: "in-progress", label: "Build: dark mode" },
  { id: "review-login", column: "review", label: "Review: login PR" },
  { id: "project-setup", column: "done", label: "Project setup" },
  { id: "ci-pipeline", column: "done", label: "CI pipeline" },
];

/** source is the prerequisite card; target depends on it. */
const DEPENDENCIES: [string, string][] = [
  ["idea-dark-mode", "spec-dark-mode"],
  ["spec-dark-mode", "build-dark-mode"],
  ["design-login", "build-login"],
  ["project-setup", "build-login"],
  ["ci-pipeline", "build-login"],
  ["build-login", "review-login"],
];

/** Build the generic board GraphModel. Every card exists (generated). */
export function buildBoardModel(opts?: { name?: string }): GraphModel {
  const sectionNodes: GraphNode[] = COLUMNS.map((c) => ({
    id: `section:${c.id}`,
    label: c.label,
    kind: "section",
    sectionId: c.id,
    origin: "auto",
    status: "generated",
  }));

  const cardNodes: GraphNode[] = CARDS.map((card) => ({
    id: card.id,
    label: card.label,
    kind: "doc",
    sectionId: card.column,
    origin: "auto",
    status: "generated",
  }));

  const edges: GraphEdge[] = DEPENDENCIES.map(([source, target]) => ({
    id: `e:${source}->${target}`,
    source,
    target,
    kind: "dependency",
    origin: "auto",
    via: "base",
  }));

  return {
    meta: { name: opts?.name ?? "Task board", base: BOARD_BASE_ID },
    sections: COLUMNS,
    nodes: [...sectionNodes, ...cardNodes],
    edges,
  };
}
