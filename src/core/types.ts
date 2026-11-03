/**
 * Strata core contract — the GENERIC engine model. It knows nothing about the
 * SDLC (or any other domain): a template produces a GraphModel conforming to
 * these types, and the editor renders/edits it. SDLC is just the first template.
 */

export type NodeKind = "section" | "doc" | "comment";

/** generated: exists · missing: expected by the template but not yet created ·
 *  unavailable: existed and was removed (shown crossed out, excluded from counts). */
export type NodeStatus = "generated" | "missing" | "unavailable";

/** auto: produced by the template/scanner · manual: added by the user. */
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
  via?: "template" | "link" | "manual";
}

export interface GraphModel {
  meta: { name: string; template: string };
  sections: Section[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** A template defines a domain: its sections and how to turn a data source
 *  (a filesystem scan, a DB, an API) into a GraphModel. The scan itself lives
 *  in the server; here we keep the shape the editor consumes. */
export interface Template {
  id: string;
  label: string;
  sections: Section[];
}
