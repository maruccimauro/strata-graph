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

function docCount(model: GraphModel, sectionId: string): number {
  return model.nodes.filter((n) => n.kind === "doc" && n.sectionId === sectionId).length;
}

/** Band boxes, one strip per section. Horizontal strips are stacked
 *  top-to-bottom and grow in height with their auto docs; vertical strips are
 *  stacked left-to-right and grow in width. */
export function computeBands(model: GraphModel, orientation: Orientation = "horizontal"): BandBox[] {
  const order = [...model.sections].sort((a, b) => a.order - b.order);
  const boxes: BandBox[] = [];
  let cursor = 0;
  for (const section of order) {
    const docs = docCount(model, section.id);
    if (orientation === "horizontal") {
      const rows = Math.max(1, Math.ceil(docs / GEO.PER_ROW));
      const height = Math.max(GEO.SECTION_H, rows * GEO.DOC_H + (rows - 1) * GEO.VGAP) + GEO.BAND_PAD * 2;
      boxes.push({ section, x: 0, y: cursor, width: GEO.CANVAS_W, height });
      cursor += height;
    } else {
      const cols = Math.max(1, Math.ceil(docs / GEO.PER_COL));
      const width = Math.max(GEO.SECTION_W, cols * GEO.DOC_W + (cols - 1) * GEO.HGAP) + GEO.BAND_PAD * 2;
      boxes.push({ section, x: cursor, y: 0, width, height: GEO.CANVAS_H });
      cursor += width;
    }
  }
  return boxes;
}

/** Fill in a default position for every node that does not already have one. */
export function applyDefaultLayout(model: GraphModel, orientation: Orientation = "horizontal"): GraphModel {
  const bands = computeBands(model, orientation);
  const bandBySection = new Map(bands.map((b) => [b.section.id, b]));
  const indexInSection = new Map<string, number>();

  const nodes = model.nodes.map((n) => {
    if (n.position) return n;
    if (n.kind === "section") {
      const band = bandBySection.get(n.sectionId!);
      if (orientation === "horizontal") {
        const top = band ? band.y : 0;
        const h = band ? band.height : GEO.SECTION_H;
        return { ...n, position: { x: GEO.SECTION_X, y: top + h / 2 - GEO.SECTION_H / 2 } };
      }
      const left = band ? band.x : 0;
      const w = band ? band.width : GEO.SECTION_W;
      return { ...n, position: { x: left + w / 2 - GEO.SECTION_W / 2, y: GEO.SECTION_Y } };
    }
    if (n.kind === "doc") {
      const band = bandBySection.get(n.sectionId!);
      const i = indexInSection.get(n.sectionId!) ?? 0;
      indexInSection.set(n.sectionId!, i + 1);
      if (orientation === "horizontal") {
        const top = band ? band.y : 0;
        const col = i % GEO.PER_ROW;
        const row = Math.floor(i / GEO.PER_ROW);
        return {
          ...n,
          position: {
            x: GEO.COL0 + col * (GEO.DOC_W + GEO.HGAP),
            y: top + GEO.BAND_PAD + row * (GEO.DOC_H + GEO.VGAP),
          },
        };
      }
      const left = band ? band.x : 0;
      const row = i % GEO.PER_COL;
      const col = Math.floor(i / GEO.PER_COL);
      return {
        ...n,
        position: {
          x: left + GEO.BAND_PAD + col * (GEO.DOC_W + GEO.HGAP),
          y: GEO.ROW0 + row * (GEO.DOC_H + GEO.VGAP),
        },
      };
    }
    // comment: float near a corner until the user moves it
    return { ...n, position: { x: GEO.CANVAS_W - 260, y: 40 } };
  });

  return { ...model, nodes };
}
