import type { GraphModel, Section } from "./types";

/** Geometry constants shared by layout and the band/section nodes. */
export const GEO = {
  CANVAS_W: 1480,
  SECTION_X: 24,
  SECTION_W: 188,
  SECTION_H: 58,
  DOC_W: 168,
  DOC_H: 56,
  COL0: 248,
  HGAP: 40,
  VGAP: 26,
  PER_ROW: 6,
  BAND_PAD: 28,
} as const;

export interface BandBox {
  section: Section;
  top: number;
  height: number;
}

/** Default band boxes (one horizontal strip per section), stacked top-to-bottom.
 *  Band height grows with the number of auto docs in the section. */
export function computeBands(model: GraphModel): BandBox[] {
  const order = [...model.sections].sort((a, b) => a.order - b.order);
  const boxes: BandBox[] = [];
  let y = 0;
  for (const section of order) {
    const docs = model.nodes.filter(
      (n) => n.kind === "doc" && n.sectionId === section.id,
    );
    const rows = Math.max(1, Math.ceil(docs.length / GEO.PER_ROW));
    const height =
      Math.max(GEO.SECTION_H, rows * GEO.DOC_H + (rows - 1) * GEO.VGAP) +
      GEO.BAND_PAD * 2;
    boxes.push({ section, top: y, height });
    y += height;
  }
  return boxes;
}

/** Fill in a default position for every node that does not already have one. */
export function applyDefaultLayout(model: GraphModel): GraphModel {
  const bands = computeBands(model);
  const bandBySection = new Map(bands.map((b) => [b.section.id, b]));
  const indexInSection = new Map<string, number>();

  const nodes = model.nodes.map((n) => {
    if (n.position) return n;
    if (n.kind === "section") {
      const band = bandBySection.get(n.sectionId!);
      const top = band ? band.top : 0;
      const h = band ? band.height : GEO.SECTION_H;
      return {
        ...n,
        position: { x: GEO.SECTION_X, y: top + h / 2 - GEO.SECTION_H / 2 },
      };
    }
    if (n.kind === "doc") {
      const band = bandBySection.get(n.sectionId!);
      const top = band ? band.top : 0;
      const i = indexInSection.get(n.sectionId!) ?? 0;
      indexInSection.set(n.sectionId!, i + 1);
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
    // comment: float near top-right until the user moves it
    return { ...n, position: { x: GEO.CANVAS_W - 260, y: 40 } };
  });

  return { ...model, nodes };
}
