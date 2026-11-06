import type { ViewerState, BreakEvent } from "./api";
import { purgeNode } from "./integrity";

export interface DeleteBandInput {
  /** the section being deleted. */
  sectionId: string;
  /** every node id belonging to the band (removed with it). Empty for an empty band. */
  nodeIds: string[];
  /** the broken-link event to register (M3 "track" path), or null to delete without
   *  tracking. Built by the caller from the pre-deletion analysis. */
  event: BreakEvent | null;
}

/** Drop the key `id` from a record override map; returns the same reference when
 *  the map is absent so no empty object is created needlessly. */
function omitKey<T>(map: Record<string, T> | undefined, id: string): Record<string, T> | undefined {
  if (!map || !(id in map)) return map;
  const next = { ...map };
  delete next[id];
  return next;
}

/** Pure state transition for deleting a band and its nodes in one commit, so undo
 *  reverts the whole operation together. It removes the band's nodes (auto ids go
 *  to `removedNodes`, manual ids leave `manualNodes`), prunes their manual edges,
 *  purges the deleted nodes from every prior alert, registers the new break event
 *  (when tracking), adds the section to `removedSections`, and purges every
 *  per-section override keyed by the section (hue, label, order, grow, frozen box)
 *  plus the deleted nodes' saved positions in every orientation. The render model's
 *  defensive filter and order reindex finish the job, so no node or override is
 *  left pointing at the removed section. */
export function deleteBandPatch(s: ViewerState, { sectionId, nodeIds, event }: DeleteBandInput): ViewerState {
  const idSet = new Set(nodeIds);
  const manualIds = new Set((s.manualNodes ?? []).filter((n) => idSet.has(n.id)).map((n) => n.id));
  const manualNodes = (s.manualNodes ?? []).filter((n) => !idSet.has(n.id));
  const autoIds = nodeIds.filter((id) => !manualIds.has(id));
  const removedNodes = [...(s.removedNodes ?? []), ...autoIds];
  const manualEdges = (s.manualEdges ?? []).filter((e) => !idSet.has(e.source) && !idSet.has(e.target));

  // Purge the deleted nodes from any prior alert (they no longer exist), then add
  // the new event when tracking broken links.
  const purged = (s.alerts ?? []).flatMap((ev) => {
    let r: BreakEvent | null = ev;
    for (const id of nodeIds) {
      if (!r) break;
      r = purgeNode(r, id);
    }
    return r ? [r] : [];
  });
  const alerts = event ? [...purged, event] : purged;

  const removedSections = (s.removedSections ?? []).includes(sectionId)
    ? s.removedSections ?? []
    : [...(s.removedSections ?? []), sectionId];

  const bandBoxes = s.bandBoxes ? { ...s.bandBoxes } : undefined;
  if (bandBoxes) for (const o of Object.keys(bandBoxes) as (keyof typeof bandBoxes)[]) bandBoxes[o] = omitKey(bandBoxes[o], sectionId);

  // Drop the deleted nodes' saved positions in every orientation.
  const pos = s.pos ? { ...s.pos } : undefined;
  if (pos) {
    for (const o of Object.keys(pos) as (keyof typeof pos)[]) {
      const m = pos[o];
      if (!m) continue;
      const next = { ...m };
      for (const id of nodeIds) delete next[id];
      pos[o] = next;
    }
  }

  return {
    ...s,
    manualNodes,
    removedNodes,
    manualEdges,
    alerts,
    removedSections,
    sectionHues: omitKey(s.sectionHues, sectionId),
    sectionLabels: omitKey(s.sectionLabels, sectionId),
    sectionOrder: omitKey(s.sectionOrder, sectionId),
    bandGrow: omitKey(s.bandGrow, sectionId),
    ...(bandBoxes ? { bandBoxes } : {}),
    ...(pos ? { pos } : {}),
  };
}
