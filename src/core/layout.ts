import type { GraphModel, GraphNode, Section } from "./types";

/** Band orientation: horizontal = rows stacked top-to-bottom; vertical =
 *  columns stacked left-to-right. */
export type Orientation = "horizontal" | "vertical";

/** Geometry constants shared by layout and the band/section nodes. */
export const GEO = {
  CANVAS_W: 1480,
  CANVAS_H: 660,
  SECTION_X: 24,
  SECTION_Y: 24,
  SECTION_W: 188,
  SECTION_H: 58,
  DOC_W: 168,
  DOC_H: 56,
  COL0: 248,
  ROW0: 120,
  HGAP: 40,
  VGAP: 26,
  PER_ROW: 6,
  PER_COL: 6,
  BAND_PAD: 28,
} as const;

export interface BandBox {
  section: Section;
  x: number;
  y: number;
  width: number;
  height: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

function docsOf(model: GraphModel, sectionId: string): GraphNode[] {
  return model.nodes.filter((n) => n.kind === "doc" && n.sectionId === sectionId);
}

/** Band size from its document count alone (the grid floor): the size a band has
 *  before any node is dragged past it. */
function countSize(count: number, orientation: Orientation): { width: number; height: number } {
  if (orientation === "horizontal") {
    const rows = Math.max(1, Math.ceil(count / GEO.PER_ROW));
    const height = Math.max(GEO.SECTION_H, rows * GEO.DOC_H + (rows - 1) * GEO.VGAP) + GEO.BAND_PAD * 2;
    return { width: GEO.CANVAS_W, height };
  }
  const cols = Math.max(1, Math.ceil(count / GEO.PER_COL));
  const width = Math.max(GEO.SECTION_W, cols * GEO.DOC_W + (cols - 1) * GEO.HGAP) + GEO.BAND_PAD * 2;
  return { width, height: GEO.CANVAS_H };
}

/** The grid floor on the stacking axis (height when horizontal, width when vertical). */
function gridBandS(count: number, orientation: Orientation): number {
  const g = countSize(count, orientation);
  return orientation === "horizontal" ? g.height : g.width;
}

/** Band origins under the document-count sizing only (no content growth). Used to
 *  convert saved positions between absolute and band-relative (see migrations). */
export function countBandOrigins(model: GraphModel, orientation: Orientation): Map<string, { x: number; y: number }> {
  const order = [...model.sections].sort((a, b) => a.order - b.order);
  const origins = new Map<string, { x: number; y: number }>();
  let cursor = 0;
  for (const section of order) {
    const grid = countSize(docsOf(model, section.id).length, orientation);
    if (orientation === "horizontal") {
      origins.set(section.id, { x: 0, y: cursor });
      cursor += grid.height;
    } else {
      origins.set(section.id, { x: cursor, y: 0 });
      cursor += grid.width;
    }
  }
  return origins;
}

/** Fill in an absolute default position for every node that does not already have
 *  one: documents in a grid inside their band, the central at the band's cross
 *  center with a fixed long-axis margin, comments floating near a corner. */
export function applyDefaultLayout(model: GraphModel, orientation: Orientation = "horizontal"): GraphModel {
  const origins = countBandOrigins(model, orientation);
  const indexInSection = new Map<string, number>();

  const nodes = model.nodes.map((n) => {
    if (n.position) return n;
    if (n.kind === "section") {
      // Pinned under the band label, indented from the start (packLayout keeps it
      // there; this is the pre-pack default).
      const o = n.sectionId ? origins.get(n.sectionId) : undefined;
      if (orientation === "horizontal") {
        const top = o ? o.y : 0;
        return { ...n, position: { x: GEO.SECTION_X, y: top + 34 } };
      }
      const left = o ? o.x : 0;
      return { ...n, position: { x: left + GEO.SECTION_X, y: GEO.SECTION_Y } };
    }
    if (n.kind === "doc" && n.sectionId && origins.has(n.sectionId)) {
      const o = origins.get(n.sectionId)!;
      const i = indexInSection.get(n.sectionId) ?? 0;
      indexInSection.set(n.sectionId, i + 1);
      if (orientation === "horizontal") {
        const col = i % GEO.PER_ROW;
        const row = Math.floor(i / GEO.PER_ROW);
        return { ...n, position: { x: GEO.COL0 + col * (GEO.DOC_W + GEO.HGAP), y: o.y + GEO.BAND_PAD + row * (GEO.DOC_H + GEO.VGAP) } };
      }
      const row = i % GEO.PER_COL;
      const col = Math.floor(i / GEO.PER_COL);
      return { ...n, position: { x: o.x + GEO.BAND_PAD + col * (GEO.DOC_W + GEO.HGAP), y: GEO.ROW0 + row * (GEO.DOC_H + GEO.VGAP) } };
    }
    // sectionless doc or comment: float near a corner in absolute coordinates.
    return { ...n, position: { x: GEO.CANVAS_W - 260, y: 40 } };
  });

  return { ...model, nodes };
}

export interface PackResult {
  bands: BandBox[];
  model: GraphModel;
}

export interface PackOptions {
  /** the section being actively dragged: its band wraps its content where it is,
   *  and the other bands pack outward from it, so the dragged node stays put and
   *  only the side that grows pushes its neighbors. */
  anchorSection?: string;
  /** captured band boxes (one per section), used to freeze a band's stacking size.
   *  A band is frozen only when its `grow` is false and a box is given for it; the
   *  box's stacking size is kept and its nodes are confined, while bands that grow
   *  size to their content. When every band is frozen this locks the whole layout. */
  fixedBands?: Record<string, { x: number; y: number; width: number; height: number }>;
  /** effective auto-grow per section (per-band override of the global toggle). A
   *  band grows to its content when true and is frozen (see `fixedBands`) when
   *  false. Defaults to grow for every band. */
  grow?: (sectionId: string) => boolean;
}

/**
 * Pack the bands from the absolute positions of their content.
 *
 * Each band is sized on the stacking axis (S: vertical->x, horizontal->y) to the
 * bounding box of its documents, so empty space is reclaimed on both sides. Bands
 * are laid contiguously in order; growth on one side pushes the neighbors on that
 * side only. The long axis (L) is a single range shared by every band, anchored on
 * the documents with room reserved for the central, so a node dragged far along L
 * grows every band together and can extend in either direction, and the central
 * tracks the band's long-axis start.
 *
 * Each band grows to its content (with a grid floor) unless it is frozen (see
 * `opts.grow` and `opts.fixedBands`), in which case its captured stacking size is
 * kept and its nodes confined; freezing every band locks the whole layout. Returns
 * the band boxes and the model with its document/central positions snapped into the
 * packed layout (comments and sectionless nodes are left untouched).
 */
export function packLayout(model: GraphModel, orientation: Orientation = "horizontal", opts: PackOptions = {}): PackResult {
  const isH = orientation === "horizontal";
  const DS = isH ? GEO.DOC_H : GEO.DOC_W; // document extent on the stacking axis
  const DL = isH ? GEO.DOC_W : GEO.DOC_H; // document extent on the long axis
  const CL = isH ? GEO.SECTION_W : GEO.SECTION_H; // central extent on the long axis
  const CANVAS_L = isH ? GEO.CANVAS_W : GEO.CANVAS_H;
  const M = isH ? GEO.SECTION_X : GEO.SECTION_Y; // central margin from the band's long-axis start
  // Central offset on the stacking axis so it sits just under the band label and
  // indented from the band start (below the name in both orientations). The central
  // is pinned here, never dragged nor following its content.
  const INDENT_S = isH ? 34 : GEO.SECTION_X;
  const RESERVE_L = isH ? GEO.COL0 : GEO.ROW0; // long-axis room reserved before the documents (central)
  const getS = (p: { x: number; y: number }) => (isH ? p.y : p.x);
  const getL = (p: { x: number; y: number }) => (isH ? p.x : p.y);
  const mk = (s: number, l: number) => (isH ? { x: l, y: s } : { x: s, y: l });

  const order = [...model.sections].sort((a, b) => a.order - b.order);
  const secIds = new Set(order.map((s) => s.id));
  const docsBy = new Map<string, GraphNode[]>();
  const centralBy = new Map<string, GraphNode>();
  for (const n of model.nodes) {
    if (n.kind === "doc" && n.sectionId && secIds.has(n.sectionId)) {
      const a = docsBy.get(n.sectionId);
      if (a) a.push(n);
      else docsBy.set(n.sectionId, [n]);
    } else if (n.kind === "section" && n.sectionId && secIds.has(n.sectionId)) {
      centralBy.set(n.sectionId, n);
    }
  }

  // Per-band grow: a band is frozen when its grow is off and a captured box is
  // given for it (its stacking size is kept, its nodes confined); the rest size to
  // their content. The long axis stays shared by every band.
  const fixed = opts.fixedBands;
  const grow = opts.grow ?? (() => true);
  const frozenBox = (id: string) => (!grow(id) && fixed?.[id] ? fixed[id] : undefined);
  const frozenStartS = (b: { x: number; y: number }) => (isH ? b.y : b.x);
  const frozenSizeS = (b: { width: number; height: number }) => (isH ? b.height : b.width);

  // Stacking-axis size and content minimum per band. A frozen band keeps its
  // captured stacking size; a growing band is sized to its content bounding box
  // with the document-count grid as a floor.
  const sizeS = new Map<string, number>();
  const sMinBy = new Map<string, number | null>();
  for (const sec of order) {
    const fb = frozenBox(sec.id);
    if (fb) {
      sizeS.set(sec.id, frozenSizeS(fb));
      sMinBy.set(sec.id, null);
      continue;
    }
    const list = docsBy.get(sec.id) ?? [];
    const gS = gridBandS(list.length, orientation);
    if (list.length) {
      let mn = Infinity;
      let mx = -Infinity;
      for (const d of list) {
        const s = getS(d.position!);
        mn = Math.min(mn, s);
        mx = Math.max(mx, s + DS);
      }
      sMinBy.set(sec.id, mn);
      sizeS.set(sec.id, Math.max(gS, mx - mn + GEO.BAND_PAD * 2));
    } else {
      sizeS.set(sec.id, gS);
      sMinBy.set(sec.id, null);
    }
  }

  // Pack the bands contiguously, anchored on the dragged band (or the first band).
  // A frozen anchor starts at its captured box, so freezing every band reproduces
  // the captured contiguous layout exactly.
  const sStart = new Map<string, number>();
  let aIdx = opts.anchorSection ? order.findIndex((s) => s.id === opts.anchorSection) : 0;
  if (aIdx < 0) aIdx = 0;
  const anchor = order[aIdx];
  if (anchor) {
    const aFrozen = frozenBox(anchor.id);
    if (aFrozen) {
      sStart.set(anchor.id, frozenStartS(aFrozen));
    } else {
      const aMin = sMinBy.get(anchor.id);
      const aCentral = centralBy.get(anchor.id);
      const aBase = aMin != null ? aMin : aCentral && aCentral.position ? getS(aCentral.position) : 0;
      sStart.set(anchor.id, aBase - GEO.BAND_PAD);
    }
    for (let i = aIdx + 1; i < order.length; i++) sStart.set(order[i].id, sStart.get(order[i - 1].id)! + sizeS.get(order[i - 1].id)!);
    for (let i = aIdx - 1; i >= 0; i--) sStart.set(order[i].id, sStart.get(order[i + 1].id)! - sizeS.get(order[i].id)!);
  }

  // Shared long-axis range across every band, anchored on the documents with room
  // reserved before them for the central. The range extends in either direction as
  // documents are dragged along the long axis, and the central tracks its start.
  let lDocMin = Infinity;
  let lDocMax = -Infinity;
  for (const sec of order) {
    for (const d of docsBy.get(sec.id) ?? []) {
      const l = getL(d.position!);
      lDocMin = Math.min(lDocMin, l);
      lDocMax = Math.max(lDocMax, l + DL);
    }
  }
  if (lDocMin === Infinity) {
    lDocMin = RESERVE_L;
    lDocMax = RESERVE_L;
  }
  const lStart = lDocMin - RESERVE_L;
  const centralL = lStart + M;
  const lEnd = Math.max(lDocMax, centralL + CL);
  const lSize = Math.max(CANVAS_L, lEnd - lStart);

  const bands: BandBox[] = [];
  const posById = new Map<string, { x: number; y: number }>();
  for (const sec of order) {
    const st = sStart.get(sec.id) ?? 0;
    const sz = sizeS.get(sec.id)!;
    bands.push(isH ? { section: sec, x: lStart, y: st, width: lSize, height: sz } : { section: sec, x: st, y: lStart, width: sz, height: lSize });

    const fb = frozenBox(sec.id);
    if (fb) {
      // Frozen band: shift its nodes rigidly with the band (it may have moved as a
      // neighbor grew) and confine them to the kept box, without resizing it.
      const deltaS = st - frozenStartS(fb);
      const lo = st + GEO.BAND_PAD / 2;
      const hi = st + Math.max(0, sz - DS - GEO.BAND_PAD / 2);
      for (const d of docsBy.get(sec.id) ?? []) {
        posById.set(d.id, mk(clamp(getS(d.position!) + deltaS, lo, hi), getL(d.position!)));
      }
    } else {
      const sMin = sMinBy.get(sec.id);
      const deltaS = sMin != null ? st + GEO.BAND_PAD - sMin : 0;
      for (const d of docsBy.get(sec.id) ?? []) {
        posById.set(d.id, mk(getS(d.position!) + deltaS, getL(d.position!)));
      }
    }
    const c = centralBy.get(sec.id);
    if (c) {
      // Pinned under the band label, indented from the start (not content-driven).
      posById.set(c.id, mk(st + INDENT_S, centralL));
    }
  }

  const nodes = model.nodes.map((n) => (posById.has(n.id) ? { ...n, position: posById.get(n.id)! } : n));
  return { bands, model: { ...model, nodes } };
}
