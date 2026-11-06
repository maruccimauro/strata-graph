import type { GraphModel } from "../core/types";
import type { AlertRole, AlertSeverity, BreakEvent } from "./api";

const SEP = "\u0000";
const key = (p: { source: string; target: string }): string => `${p.source}${SEP}${p.target}`;
const samePair = (a: { source: string; target: string }, b: { source: string; target: string }) => a.source === b.source && a.target === b.target;

/** What deleting a node does to the nodes that depended on it (N-44). The model
 *  is dependent-centric: only the **dependents** (the outgoing side) are flagged;
 *  prerequisites are ignored. Each dependent carries a list of pending
 *  reconnection options (one per prerequisite of the removed node), and stays in
 *  the alert until every option is decided (connected or removed) or it is
 *  unlinked. Computed from the current render model before the deletion. */
export interface BreakAnalysis {
  /** outgoing neighbors that lose their prerequisite ("Required by"): the flagged
   *  nodes, each reconnectable to one of the removed node's prerequisites. */
  dependents: string[];
  /** incoming neighbors (the removed node's prerequisites): reconnection options. */
  prereqs: string[];
  /** prerequisite -> dependent options (one per reconnectable pair). */
  pairs: { source: string; target: string }[];
  /** dependents with no option at all (kept in alert until unlinked). */
  lonely: string[];
  /** per dependent: severity at delete time. `role` is always "dependent". */
  info: Record<string, { role: AlertRole; severity: AlertSeverity }>;
}

export function analyzeBreak(model: GraphModel, id: string): BreakAnalysis {
  const deps = model.edges.filter((e) => e.kind === "dependency");
  const prereqs = Array.from(new Set(deps.filter((e) => e.target === id).map((e) => e.source)));
  const dependents = Array.from(new Set(deps.filter((e) => e.source === id).map((e) => e.target)));

  const remaining = deps.filter((e) => e.source !== id && e.target !== id);
  const degree = new Map<string, number>();
  for (const e of remaining) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  const existing = new Set(remaining.map((e) => key(e)));
  const pairs: { source: string; target: string }[] = [];
  for (const d of dependents) {
    for (const p of prereqs) {
      if (p === d) continue;
      if (existing.has(`${p}${SEP}${d}`)) continue;
      pairs.push({ source: p, target: d });
    }
  }

  const info: Record<string, { role: AlertRole; severity: AlertSeverity }> = {};
  for (const d of dependents) info[d] = { role: "dependent", severity: (degree.get(d) ?? 0) === 0 ? "orphan" : "partial" };

  const hasPair = new Set(pairs.map((p) => p.target));
  const lonely = dependents.filter((d) => !hasPair.has(d));
  return { dependents, prereqs, pairs, lonely, info };
}

/** Build the persisted BreakEvent from an analysis and the options accepted at
 *  delete time. Accepted (checked) options are created as edges by the caller;
 *  the unchecked ones stay as pending decisions. A dependent is flagged while it
 *  has a pending option or has no option at all (lonely). Returns null when every
 *  dependent is fully resolved upfront. */
export function buildBreakEvent(
  analysis: BreakAnalysis,
  removedLabel: string,
  acceptedKeys: Set<string>,
  now: number,
): BreakEvent | null {
  const pairs = analysis.pairs.filter((p) => !acceptedKeys.has(key(p)));
  const withPending = new Set(pairs.map((p) => p.target));
  const affected = analysis.dependents.filter((d) => withPending.has(d) || analysis.lonely.includes(d));
  if (affected.length === 0) return null;
  const aff = new Set(affected);

  const info: BreakEvent["info"] = {};
  for (const d of affected) info[d] = analysis.info[d];
  const lonely = analysis.lonely.filter((d) => aff.has(d));
  const kept = pairs.filter((p) => aff.has(p.target));

  return {
    id: `brk:${now.toString(36)}:${Math.random().toString(36).slice(2, 6)}`,
    at: now,
    removedLabel,
    pairs: kept,
    lonely,
    info,
    hidden: false,
  };
}

/** Re-derive an event after its options or lonely set changed: a dependent stays
 *  only while it is lonely or still has a pending option; drop the rest, narrow
 *  the pairs accordingly, and return null when no dependent is left. */
export function normalizeEvent(ev: BreakEvent): BreakEvent | null {
  const withPair = new Set(ev.pairs.map((p) => p.target));
  const lonely = ev.lonely.filter((d) => ev.info[d]);
  const keep = (d: string) => withPair.has(d) || lonely.includes(d);
  const info: BreakEvent["info"] = {};
  for (const d of Object.keys(ev.info)) if (keep(d)) info[d] = ev.info[d];
  if (Object.keys(info).length === 0) return null;
  const pairs = ev.pairs.filter((p) => info[p.target]);
  const nLonely = lonely.filter((d) => info[d]);
  return { ...ev, info, pairs, lonely: nLonely };
}

/** Drop one reconnection option (after it is connected or removed). The dependent
 *  stays if it still has other options. */
export function dropPair(ev: BreakEvent, pair: { source: string; target: string }): BreakEvent | null {
  return normalizeEvent({ ...ev, pairs: ev.pairs.filter((p) => !samePair(p, pair)) });
}

/** Drop a whole dependent (reconnected to all, unlinked, or deleted as a node):
 *  remove it from the affected set, its options and the lonely set. */
export function dropDependent(ev: BreakEvent, depId: string): BreakEvent | null {
  const info = { ...ev.info };
  delete info[depId];
  return normalizeEvent({ ...ev, info, pairs: ev.pairs.filter((p) => p.target !== depId), lonely: ev.lonely.filter((d) => d !== depId) });
}

/** Purge a deleted node from an event: it may be an affected dependent or a
 *  reconnection source, so drop it from both sides. */
export function purgeNode(ev: BreakEvent, nodeId: string): BreakEvent | null {
  const info = { ...ev.info };
  delete info[nodeId];
  return normalizeEvent({ ...ev, info, pairs: ev.pairs.filter((p) => p.source !== nodeId && p.target !== nodeId), lonely: ev.lonely.filter((d) => d !== nodeId) });
}

/** Node ids currently flagged by any active alert (the dependents), with the
 *  worst severity across the events touching each one. */
export function alertedNodes(alerts: BreakEvent[] | undefined): Map<string, AlertSeverity> {
  const out = new Map<string, AlertSeverity>();
  for (const ev of alerts ?? []) {
    for (const [id, meta] of Object.entries(ev.info)) {
      if (meta.severity === "orphan" || !out.has(id)) out.set(id, meta.severity);
    }
  }
  return out;
}

/** Total count of flagged dependents across all active alerts (status badge). */
export function alertCount(alerts: BreakEvent[] | undefined): number {
  return alertedNodes(alerts).size;
}
