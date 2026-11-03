/**
 * Strata Graph Model (.sgm) serialization. An .sgm file is a portable, self
 * contained graph document: a versioned JSON envelope around a GraphModel
 * (meta, sections, nodes, edges) with positions and metadata already baked in,
 * so it reopens exactly as exported. The format is domain agnostic, like the
 * engine: a built-in model (SDLC or any other) just produces a GraphModel to wrap.
 */
import type { GraphModel } from "./types";

export const SGM_FORMAT = "strata-graph-model";
export const SGM_VERSION = 1;
export const SGM_EXTENSION = ".sgm";

export interface SgmDocument {
  format: typeof SGM_FORMAT;
  version: number;
  model: GraphModel;
}

/** Serialize a GraphModel to the .sgm text (pretty-printed JSON). */
export function toSgm(model: GraphModel): string {
  const doc: SgmDocument = { format: SGM_FORMAT, version: SGM_VERSION, model };
  return JSON.stringify(doc, null, 2);
}

/** Parse and validate .sgm text, returning the GraphModel. Throws a clear
 *  Error on malformed input or an unsupported (future) version. */
export function fromSgm(text: string): GraphModel {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid .sgm file: not valid JSON.");
  }
  const doc = parsed as Partial<SgmDocument> | null;
  if (!doc || typeof doc !== "object" || doc.format !== SGM_FORMAT) {
    throw new Error("Invalid .sgm file: missing Strata Graph Model header.");
  }
  if (typeof doc.version !== "number" || doc.version < 1 || doc.version > SGM_VERSION) {
    throw new Error(`Unsupported .sgm version: ${String(doc.version)} (this build reads up to ${SGM_VERSION}).`);
  }
  const m = doc.model as GraphModel | undefined;
  if (
    !m ||
    typeof m !== "object" ||
    !m.meta ||
    !Array.isArray(m.sections) ||
    !Array.isArray(m.nodes) ||
    !Array.isArray(m.edges)
  ) {
    throw new Error("Invalid .sgm file: malformed model (needs meta, sections, nodes, edges).");
  }
  return m;
}
