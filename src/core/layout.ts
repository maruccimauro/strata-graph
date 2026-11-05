import type { GraphModel, Section } from "./types";

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

/** Document nodes of a section (kind "doc"). */
function docsOf(model: GraphModel, sectionId: string) {
  return model.nodes.filter((n) => n.kind === "doc" && n.sectionId === sectionId);
}

/** Band size from its document count alone (the grid floor): the size a band has
 *  before any node is dragged past it. Positions never shrink a band below this. */
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

/** Band boxes, one strip per section. A band is sized to the larger of its
 *  document-count grid and the real extent of its content: document positions are
 *  relative to the band origin, so a node dragged past the band grows it (both
 *  axes). Horizontal strips stack top-to-bottom, vertical strips left-to-right. */
export function computeBands(model: GraphModel, orientation: Orientation = "horizontal"): BandBox[] {
  const order = [...model.sections].sort((a, b) => a.order - b.order);
  const boxes: BandBox[] = [];
  let cursor = 0;
  for (const section of order) {
    const docs = docsOf(model, section.id);
    const grid = countSize(docs.length, orientation);
    // Content extent from the relative positions of positioned documents.
    let maxRight = 0;
    let maxBottom = 0;
    for (const d of docs) {
      if (!d.position) continue;
      maxRight = Math.max(maxRight, d.position.x + GEO.DOC_W);
      maxBottom = Math.max(maxBottom, d.position.y + GEO.DOC_H);
    }
    const width = Math.max(grid.width, maxRight + GEO.BAND_PAD);
    const height = Math.max(grid.height, maxBottom + GEO.BAND_PAD);
    if (orientation === "horizontal") {
      boxes.push({ section, x: 0, y: cursor, width, height });
      cursor += height;
    } else {
      boxes.push({ section, x: cursor, y: 0, width, height });
      cursor += width;
    }
  }
  return boxes;
}

/** Band origins under the document-count sizing only (no content growth). Used to
 *  convert legacy absolute positions into band-relative ones (see migrations). */
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

/** Fill in a default position for every node that does not already have one.
 *  Document and section positions are relative to their band origin (they render
 *  as children of the band node); comments stay in absolute canvas coordinates. */
export function applyDefaultLayout(model: GraphModel, orientation: Orientation = "horizontal"): GraphModel {
  const bands = computeBands(model, orientation);
  const bandBySection = new Map(bands.map((b) => [b.section.id, b]));
  const indexInSection = new Map<string, number>();

  const nodes = model.nodes.map((n) => {
    if (n.position) return n;
    if (n.kind === "section") {
      const band = n.sectionId ? bandBySection.get(n.sectionId) : undefined;
      if (orientation === "horizontal") {
        const h = band ? band.height : GEO.SECTION_H;
        return { ...n, position: { x: GEO.SECTION_X, y: h / 2 - GEO.SECTION_H / 2 } };
      }
      const w = band ? band.width : GEO.SECTION_W;
      return { ...n, position: { x: w / 2 - GEO.SECTION_W / 2, y: GEO.SECTION_Y } };
    }
    if (n.kind === "doc" && n.sectionId) {
      const i = indexInSection.get(n.sectionId) ?? 0;
      indexInSection.set(n.sectionId, i + 1);
      if (orientation === "horizontal") {
        const col = i % GEO.PER_ROW;
        const row = Math.floor(i / GEO.PER_ROW);
        return {
          ...n,
          position: {
            x: GEO.COL0 + col * (GEO.DOC_W + GEO.HGAP),
            y: GEO.BAND_PAD + row * (GEO.DOC_H + GEO.VGAP),
          },
        };
      }
      const row = i % GEO.PER_COL;
      const col = Math.floor(i / GEO.PER_COL);
      return {
        ...n,
        position: {
          x: GEO.BAND_PAD + col * (GEO.DOC_W + GEO.HGAP),
          y: GEO.ROW0 + row * (GEO.DOC_H + GEO.VGAP),
        },
      };
    }
    // sectionless doc or comment: float near a corner in absolute coordinates.
    return { ...n, position: { x: GEO.CANVAS_W - 260, y: 40 } };
  });

  return { ...model, nodes };
}
