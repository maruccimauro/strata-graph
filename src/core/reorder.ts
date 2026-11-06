import type { Section } from "./types";

/** Sections sorted by their effective order (ascending). Ties keep input order. */
export function orderedSections(sections: Section[]): Section[] {
  return sections.map((s, i) => ({ s, i })).sort((a, b) => a.s.order - b.s.order || a.i - b.i).map(({ s }) => s);
}

/** Build a full, contiguous order map (0..n-1) from an ordered section list. */
function indexMap(ordered: Section[]): Record<string, number> {
  return Object.fromEntries(ordered.map((s, i) => [s.id, i]));
}

/** Move section `id` to `targetIndex` in the ordered list and return the new
 *  sectionOrder override: a full, contiguous {id: order} map. Pure and
 *  idempotent at the ends; `targetIndex` is clamped into range. */
export function reorderSections(sections: Section[], id: string, targetIndex: number): Record<string, number> {
  const ordered = orderedSections(sections);
  const from = ordered.findIndex((s) => s.id === id);
  if (from === -1) return indexMap(ordered);
  const to = Math.max(0, Math.min(ordered.length - 1, targetIndex));
  if (to === from) return indexMap(ordered);
  const next = [...ordered];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return indexMap(next);
}

/** Move section `id` one step toward the start (-1) or the end (+1). */
export function moveSection(sections: Section[], id: string, dir: -1 | 1): Record<string, number> {
  const ordered = orderedSections(sections);
  const from = ordered.findIndex((s) => s.id === id);
  if (from === -1) return indexMap(ordered);
  return reorderSections(sections, id, from + dir);
}
