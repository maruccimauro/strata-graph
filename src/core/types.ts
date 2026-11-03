/**
 * Strata core contract — the GENERIC engine model. It knows nothing about the
 * SDLC (or any other domain). The portable document is a Strata Graph Model (a
 * GraphModel conforming to these types, saved as .sgm), and the editor
 * renders/edits it. SDLC is just the first built-in Strata Graph Model.
 */

export type NodeKind = "section" | "doc" | "comment";

/** generated: exists · missing: expected by the built-in model but not yet
 *  created · unavailable: existed and was removed (crossed out, excluded from counts). */
export type NodeStatus = "generated" | "missing" | "unavailable";

/** auto: produced by the built-in model/scanner · manual: added by the user. */
export type Origin = "auto" | "manual";

export interface Section {
  id: string;
  label: string;
  /** HSL hue 0-360; the editor derives band/accent colors (light + dark). */
  hue: number;
  order: number;
}

export interface NodeFile {
  /** path relative to the scanned root. */
  path: string;
  /** absolute path, only known in connected mode (local server). */
  abspath?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  /** section this node belongs to (undefined for free-floating comments). */
  sectionId?: string;
  origin: Origin;
  status?: NodeStatus;
  files?: NodeFile[];
  note?: string;
  /** epoch ms when the node was created; manual nodes set this automatically. */
  createdAt?: number;
  /** epoch ms deadline; the editor renders a live countdown and an overdue state. */
  dueAt?: number;
  /** when true, the node cannot be dragged on the canvas. */
  locked?: boolean;
  /** persisted position; when absent the layout computes a default. */
  position?: { x: number; y: number };
}

/** source = prerequisite (upstream); target depends on source (downstream). */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  /** dependency: real edge between docs · comment: link from a comment node. */
  kind: "dependency" | "comment";
  origin: Origin;
  /** how the edge was established, for styling/trust. */
  via?: "base" | "link" | "manual";
}

/** A Strata Graph Model: the engine's portable document (saved as .sgm). */
export interface GraphModel {
  /** name of the model · base: id of the built-in model it derives from (or "custom"). */
  meta: { name: string; base: string };
  sections: Section[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}
