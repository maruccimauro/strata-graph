/**
 * Strata Graph Model (.sgm) serialization. An .sgm file is a portable, self
 * contained graph document: a versioned JSON envelope around a GraphModel
 * (meta, sections, nodes, edges) with positions and metadata already baked in,
 * so it reopens exactly as exported. The format is domain agnostic, like the
 * engine: a built-in model (SDLC or any other) just produces a GraphModel to wrap.
 */
import type { GraphModel } from "./types";
import { countBandOrigins } from "./layout";

export const SGM_FORMAT = "strata-graph-model";
export const SGM_VERSION = 3;
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
  // v1 and v3 bake absolute positions; v2 baked band-relative ones, so add the
  // band origin back. Comments and sectionless docs stay absolute in every version.
  return doc.version === 2 ? migrateModelV2ToV3(m) : m;
}

/** Convert a v2 model (band-relative positions) to absolute coordinates, assuming
 *  horizontal layout (v2 did not record the orientation). Best effort for the
 *  short-lived v2 files; exact for v1/v3, which are already absolute. */
function migrateModelV2ToV3(m: GraphModel): GraphModel {
  const origins = countBandOrigins(m, "horizontal");
  const nodes = m.nodes.map((n) => {
    if (!n.position) return n;
    const sid = n.kind === "section" || n.kind === "doc" ? n.sectionId : undefined;
    const origin = sid ? origins.get(sid) : undefined;
    return origin ? { ...n, position: { x: n.position.x + origin.x, y: n.position.y + origin.y } } : n;
  });
  return { ...m, nodes };
}
