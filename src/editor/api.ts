import type { GraphModel, GraphNode, GraphEdge } from "../core/types";
import { countBandOrigins } from "../core/layout";

export type Mode = "connected" | "static";

/** Position storage schema. v1 and v3 store absolute canvas coordinates; v2
 *  (short-lived) stored them relative to the band origin. The packing engine
 *  works in absolute coordinates, so v3 is absolute again. Migrated once at boot. */
export const POS_SCHEMA = 3;

export interface Prefs {
  /** hide "not generated" placeholder nodes. */
  hideMissing: boolean;
  /** edge color: follow the target section hue, or a neutral gray. */
  edgeColor: "section" | "neutral";
  /** show dependency edges / dependent edges (quick view toggles). */
  showDeps: boolean;
  /** band orientation: horizontal rows or vertical columns. */
  layout: "horizontal" | "vertical";
  /** on hover, transiently highlight a node's upstream/downstream paths and the
   *  hovered edge (same visual as selecting, without the click). */
  hoverHighlight: boolean;
  /** let a band grow to hold a node dragged past its edge. When off, nodes are
   *  confined to their band instead. */
  autoGrowBands: boolean;
  /** UI language (i18n). English only for now; see `src/editor/i18n.ts`. */
  lang: string;
}

export const DEFAULT_PREFS: Prefs = {
  hideMissing: false,
  edgeColor: "section",
  showDeps: true,
  layout: "horizontal",
  hoverHighlight: true,
  autoGrowBands: true,
  lang: "en",
};

export type Orientation = Prefs["layout"];
export type PosMap = Record<string, { x: number; y: number }>;
/** Frozen band boxes per section, captured while auto-grow is on and reused to
 *  freeze the layout when it is off (so turning it off locks the bands in place). */
export type BandBoxMap = Record<string, { x: number; y: number; width: number; height: number }>;

export interface ViewerState {
  /** Saved node positions kept per band orientation, so each layout remembers its
   *  own arrangement. A node absent from the active orientation's map falls back
   *  to the computed default layout for that orientation. */
  pos?: Partial<Record<Orientation, PosMap>>;
  /** frozen band boxes per orientation (see BandBoxMap); used when auto-grow is off. */
  bandBoxes?: Partial<Record<Orientation, BandBoxMap>>;
  /** user-created nodes (docs by file, or comments). */
  manualNodes?: GraphNode[];
  /** user-created dependency/comment edges. */
  manualEdges?: GraphEdge[];
  /** auto edge ids the user deleted (kept out on reload). */
  removedEdges?: string[];
  /** per-node section reassignments. */
  sectionOverrides?: Record<string, string>;
  /** per-section hue overrides (0-360) over the built-in model's colors. */
  sectionHues?: Record<string, number>;
  /** per-node metadata overrides (due date, lock, creation date) applied over
   *  the base graph, so they work for auto nodes too, not only manual ones. */
  nodeMeta?: Record<string, { createdAt?: number; dueAt?: number; locked?: boolean }>;
  /** canon doc ids ever seen generated (to detect "unavailable" later). */
  seenGenerated?: string[];
  /** position storage schema version (see POS_SCHEMA); absent means legacy v1. */
  posSchema?: number;
  prefs?: Prefs;
  [k: string]: unknown;
}

export interface Boot {
  mode: Mode;
  graph: GraphModel;
  state: ViewerState;
  root?: string;
}

const KEY = (name: string) => `strata:${name}`;
const STARTUP_KEY = "strata:startup";

/** What to load on startup in static mode: a built-in id, and whether to use its
 *  demo variant. Absent until the user is first asked (first run). */
export interface Startup {
  base: string;
  demo: boolean;
}

export function loadStartup(): Startup | null {
  try {
    const raw = localStorage.getItem(STARTUP_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Startup;
    return typeof v?.base === "string" ? { base: v.base, demo: Boolean(v.demo) } : null;
  } catch {
    return null;
  }
}

export function saveStartup(s: Startup): void {
  try {
    localStorage.setItem(STARTUP_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Migrate a legacy flat `pos` map (node id -> point) to the orientation-scoped
 *  shape, assigning the old positions to the default orientation (horizontal).
 *  No-op for state already in the new shape or without positions. */
export function normalizeState(state: ViewerState): ViewerState {
  const p = state.pos as Record<string, unknown> | undefined;
  if (!p) return state;
  const isPoint = (v: unknown): boolean =>
    typeof v === "object" && v !== null && typeof (v as { x?: unknown }).x === "number" && typeof (v as { y?: unknown }).y === "number";
  const legacy = Object.values(p).some(isPoint);
  if (!legacy) return state;
  return { ...state, pos: { horizontal: p as PosMap } };
}

/** Bring saved positions up to the current schema (absolute coordinates), once.
 *  v1 and absent are already absolute. v2 stored band-relative coordinates, so its
 *  document/central positions get their band origin (under document-count sizing)
 *  added back; comments and sectionless docs are absolute in every schema. */
export function migratePositions(graph: GraphModel, state: ViewerState): ViewerState {
  if (state.posSchema === POS_SCHEMA) return state;
  // Only v2 is relative; v1 and absent are already absolute.
  if (state.posSchema !== 2 || !state.pos) return { ...state, posSchema: POS_SCHEMA };

  const overrides = state.sectionOverrides ?? {};
  const byId = new Map<string, GraphNode>();
  for (const n of graph.nodes) byId.set(n.id, n);
  for (const n of state.manualNodes ?? []) byId.set(n.id, n);

  // Effective section of a stored id (central ids are "section:<sectionId>").
  const effSection = (id: string): string | undefined => {
    if (id.startsWith("section:")) return id.slice("section:".length);
    const n = byId.get(id);
    if (!n || n.kind !== "doc") return undefined;
    return overrides[id] ?? n.sectionId ?? undefined;
  };

  // Counting model mirrors the old render model's node set and effective sections,
  // so the band origins match what the v2 positions were laid out against.
  const effNodes = [...graph.nodes, ...(state.manualNodes ?? [])].map((n) => ({
    ...n,
    sectionId: overrides[n.id] ?? n.sectionId,
  }));
  const countingModel: GraphModel = { ...graph, nodes: effNodes };

  const pos: Partial<Record<Orientation, PosMap>> = {};
  for (const o of Object.keys(state.pos) as Orientation[]) {
    const map = state.pos[o];
    if (!map) continue;
    const origins = countBandOrigins(countingModel, o);
    const out: PosMap = {};
    for (const [id, p] of Object.entries(map)) {
      const sid = effSection(id);
      const origin = sid ? origins.get(sid) : undefined;
      out[id] = origin ? { x: p.x + origin.x, y: p.y + origin.y } : p;
    }
    pos[o] = out;
  }
  return { ...state, pos, posSchema: POS_SCHEMA };
}

/** Try the connected server; fall back to the demo graph + localStorage state. */
export async function boot(demo: GraphModel): Promise<Boot> {
  try {
    const r = await fetch("/api/graph");
    if (r.ok) {
      const j = (await r.json()) as { graph: GraphModel; state: ViewerState; root?: string };
      return { mode: "connected", graph: j.graph, state: migratePositions(j.graph, normalizeState(j.state ?? {})), root: j.root };
    }
  } catch {
    /* no server -> static */
  }
  let state: ViewerState = {};
  try {
    state = JSON.parse(localStorage.getItem(KEY(demo.meta.name)) ?? "{}");
  } catch {
    /* ignore */
  }
  return { mode: "static", graph: demo, state: migratePositions(demo, normalizeState(state)) };
}

export function persist(mode: Mode, name: string, state: ViewerState): void {
  try {
    localStorage.setItem(KEY(name), JSON.stringify(state));
  } catch {
    /* ignore */
  }
  if (mode === "connected") {
    void fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => {});
  }
}

export async function pickFile(): Promise<{ abspath?: string; relpath?: string | null; name?: string; error?: string; cancelled?: boolean }> {
  const r = await fetch("/api/pick-file");
  return r.json();
}

export function openPath(path: string, kind: "file" | "folder"): void {
  void fetch("/api/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, kind }),
  }).catch(() => {});
}
