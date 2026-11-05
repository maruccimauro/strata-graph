import type { GraphModel, GraphNode, GraphEdge } from "../core/types";

export type Mode = "connected" | "static";

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
  /** UI language (i18n). English only for now; see `src/editor/i18n.ts`. */
  lang: string;
}

export const DEFAULT_PREFS: Prefs = {
  hideMissing: false,
  edgeColor: "section",
  showDeps: true,
  layout: "horizontal",
  hoverHighlight: true,
  lang: "en",
};

export type Orientation = Prefs["layout"];
export type PosMap = Record<string, { x: number; y: number }>;

export interface ViewerState {
  /** Saved node positions kept per band orientation, so each layout remembers its
   *  own arrangement. A node absent from the active orientation's map falls back
   *  to the computed default layout for that orientation. */
  pos?: Partial<Record<Orientation, PosMap>>;
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

/** Try the connected server; fall back to the demo graph + localStorage state. */
export async function boot(demo: GraphModel): Promise<Boot> {
  try {
    const r = await fetch("/api/graph");
    if (r.ok) {
      const j = (await r.json()) as { graph: GraphModel; state: ViewerState; root?: string };
      return { mode: "connected", graph: j.graph, state: normalizeState(j.state ?? {}), root: j.root };
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
  return { mode: "static", graph: demo, state: normalizeState(state) };
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
