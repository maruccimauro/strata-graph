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
      const o = n.sectionId ? origins.get(n.sectionId) : undefined;
      const sizeS = gridBandS(n.sectionId ? docsOf(model, n.sectionId).length : 0, orientation);
      if (orientation === "horizontal") {
        const top = o ? o.y : 0;
        return { ...n, position: { x: GEO.SECTION_X, y: top + sizeS / 2 - GEO.SECTION_H / 2 } };
      }
      const left = o ? o.x : 0;
      return { ...n, position: { x: left + sizeS / 2 - GEO.SECTION_W / 2, y: GEO.SECTION_Y } };
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
  /** when false, bands keep their document-count grid size and the long axis is
   *  fixed to the canvas (nodes are meant to be confined, not to grow a band). */
  grow?: boolean;
  /** the section being actively dragged: its band wraps its content where it is,
   *  and the other bands pack outward from it, so the dragged node stays put and
   *  only the side that grows pushes its neighbors. */
  anchorSection?: string;
}

/**
 * Pack the bands from the absolute positions of their content.
 *
 * Each band is sized on the stacking axis (S: vertical->x, horizontal->y) to the
 * bounding box of its documents, so empty space is reclaimed on both sides. Bands
 * are laid contiguously in order; growth on one side pushes the neighbors on that
 * side only. The long axis (L) is a single range shared by every band, taken from
 * all content (documents plus the central's fixed margin), so a node dragged far
 * along L grows every band together and can extend in either direction.
 *
 * Returns the band boxes and the model with its document/central positions snapped
 * into the packed layout (comments and sectionless nodes are left untouched).
 */
export function packLayout(model: GraphModel, orientation: Orientation = "horizontal", opts: PackOptions = {}): PackResult {
  const grow = opts.grow !== false;
  const isH = orientation === "horizontal";
  const DS = isH ? GEO.DOC_H : GEO.DOC_W; // document extent on the stacking axis
  const DL = isH ? GEO.DOC_W : GEO.DOC_H; // document extent on the long axis
  const CS = isH ? GEO.SECTION_H : GEO.SECTION_W; // central extent on the stacking axis
  const CL = isH ? GEO.SECTION_W : GEO.SECTION_H; // central extent on the long axis
  const CANVAS_L = isH ? GEO.CANVAS_W : GEO.CANVAS_H;
  const M = GEO.SECTION_X; // central long-axis margin (SECTION_X === SECTION_Y === 24)
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

  // Stacking-axis size and content minimum per band (documents only drive growth).
  const sizeS = new Map<string, number>();
  const sMinBy = new Map<string, number | null>();
  for (const sec of order) {
    const list = docsBy.get(sec.id) ?? [];
    const gS = gridBandS(list.length, orientation);
    if (grow && list.length) {
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
      sMinBy.set(sec.id, list.length ? Math.min(...list.map((d) => getS(d.position!))) : null);
    }
  }

  // Pack the bands contiguously, anchored on the dragged band (or the first band).
  const sStart = new Map<string, number>();
  let aIdx = opts.anchorSection ? order.findIndex((s) => s.id === opts.anchorSection) : 0;
  if (aIdx < 0) aIdx = 0;
  const anchor = order[aIdx];
  if (anchor) {
    const aMin = sMinBy.get(anchor.id);
    const aCentral = centralBy.get(anchor.id);
    const aBase = aMin != null ? aMin : aCentral && aCentral.position ? getS(aCentral.position) : 0;
    sStart.set(anchor.id, aBase - GEO.BAND_PAD);
    for (let i = aIdx + 1; i < order.length; i++) sStart.set(order[i].id, sStart.get(order[i - 1].id)! + sizeS.get(order[i - 1].id)!);
    for (let i = aIdx - 1; i >= 0; i--) sStart.set(order[i].id, sStart.get(order[i + 1].id)! - sizeS.get(order[i].id)!);
  }

  // Shared long-axis range across every band (content plus the central margin).
  let lMin = Infinity;
  let lMax = -Infinity;
  for (const sec of order) {
    lMin = Math.min(lMin, M);
    lMax = Math.max(lMax, M + CL);
    for (const d of docsBy.get(sec.id) ?? []) {
      const l = getL(d.position!);
      lMin = Math.min(lMin, l);
      lMax = Math.max(lMax, l + DL);
    }
  }
  const lStart = grow ? lMin - GEO.BAND_PAD : 0;
  const lSize = grow ? Math.max(CANVAS_L, lMax + GEO.BAND_PAD - lStart) : CANVAS_L;

  const bands: BandBox[] = [];
  const posById = new Map<string, { x: number; y: number }>();
  for (const sec of order) {
    const st = sStart.get(sec.id) ?? 0;
    const sz = sizeS.get(sec.id)!;
    bands.push(isH ? { section: sec, x: lStart, y: st, width: lSize, height: sz } : { section: sec, x: st, y: lStart, width: sz, height: lSize });

    const sMin = sMinBy.get(sec.id);
    const deltaS = sMin != null ? st + GEO.BAND_PAD - sMin : 0;
    for (const d of docsBy.get(sec.id) ?? []) {
      posById.set(d.id, mk(getS(d.position!) + deltaS, getL(d.position!)));
    }
    const c = centralBy.get(sec.id);
    if (c) {
      const list = docsBy.get(sec.id) ?? [];
      const raw = list.length && c.position ? getS(c.position) + deltaS : st + (sz - CS) / 2;
      const cs = clamp(raw, st, st + Math.max(0, sz - CS));
      posById.set(c.id, mk(cs, M));
    }
  }

  const nodes = model.nodes.map((n) => (posById.has(n.id) ? { ...n, position: posById.get(n.id)! } : n));
  return { bands, model: { ...model, nodes } };
}
