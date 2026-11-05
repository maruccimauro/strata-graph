import type { GraphModel } from "../core/types";
import type { AlertRole, AlertSeverity, BreakEvent } from "./api";

const SEP = "\u0000";
const key = (p: { source: string; target: string }): string => `${p.source}${SEP}${p.target}`;

/** What deleting a node does to its direct dependency neighbors (N-44). Computed
 *  from the current render model before the deletion is applied. */
export interface BreakAnalysis {
  /** incoming neighbors: prerequisites the node depended on ("Depends on"). */
  prereqs: string[];
  /** outgoing neighbors: dependents that required the node ("Required by"). */
  dependents: string[];
  /** prerequisite -> dependent bridges that would preserve a path through the
   *  removed node (direction kept). Only pairs whose edge does not already exist. */
  pairs: { source: string; target: string }[];
  /** affected neighbor ids that have no bridge candidate at all. */
  lonely: string[];
  /** per neighbor id: role relative to the removed node and severity. */
  info: Record<string, { role: AlertRole; severity: AlertSeverity }>;
}

/** Analyze the relational impact of removing `id`: its direct dependency
 *  neighbors (incoming prerequisites and outgoing dependents), the bridges that
 *  could keep the chain intact, and each neighbor's severity once the node and
 *  its edges are gone. Comment edges are ignored (they are links, not
 *  dependencies). */
export function analyzeBreak(model: GraphModel, id: string): BreakAnalysis {
  const deps = model.edges.filter((e) => e.kind === "dependency");
  const prereqs = Array.from(new Set(deps.filter((e) => e.target === id).map((e) => e.source)));
  const dependents = Array.from(new Set(deps.filter((e) => e.source === id).map((e) => e.target)));

  // Remaining dependency degree per node once the removed node and its edges go
  // (severity: a neighbor left with zero dependency edges is orphaned).
  const remaining = deps.filter((e) => e.source !== id && e.target !== id);
  const degree = new Map<string, number>();
  for (const e of remaining) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  const existing = new Set(remaining.map((e) => key(e)));
  const pairs: { source: string; target: string }[] = [];
  for (const a of prereqs) {
    for (const b of dependents) {
      if (a === b) continue;
      if (existing.has(`${a}${SEP}${b}`)) continue;
      pairs.push({ source: a, target: b });
    }
  }

  const inPair = new Set<string>();
  for (const p of pairs) {
    inPair.add(p.source);
    inPair.add(p.target);
  }

  const info: Record<string, { role: AlertRole; severity: AlertSeverity }> = {};
  const neighbors = new Set<string>([...prereqs, ...dependents]);
  for (const n of neighbors) {
    const role: AlertRole = prereqs.includes(n) ? "prereq" : "dependent";
    const severity: AlertSeverity = (degree.get(n) ?? 0) === 0 ? "orphan" : "partial";
    info[n] = { role, severity };
  }

  const lonely = [...neighbors].filter((n) => !inPair.has(n));
  return { prereqs, dependents, pairs, lonely, info };
}

/** Build the persisted BreakEvent from an analysis and the bridges accepted at
 *  delete time. A neighbor is affected when no accepted bridge touches it (the
 *  same rule the delete dialog previews); the event keeps those neighbors, the
 *  unresolved pairs that could still rebuild one of them, and the lone ones.
 *  Returns null when nothing is left affected. */
export function buildBreakEvent(
  analysis: BreakAnalysis,
  removedLabel: string,
  acceptedKeys: Set<string>,
  now: number,
): BreakEvent | null {
  const covered = new Set<string>();
  for (const p of analysis.pairs) {
    if (acceptedKeys.has(key(p))) {
      covered.add(p.source);
      covered.add(p.target);
    }
  }
  const affectedIds = Object.keys(analysis.info).filter((id) => !covered.has(id));
  if (affectedIds.length === 0) return null;
  const affected = new Set(affectedIds);

  const info: BreakEvent["info"] = {};
  for (const id of affectedIds) info[id] = analysis.info[id];

  const pairs = analysis.pairs.filter((p) => !acceptedKeys.has(key(p)) && (affected.has(p.source) || affected.has(p.target)));
  const lonely = affectedIds.filter((id) => !pairs.some((p) => p.source === id || p.target === id));

  return {
    id: `brk:${now.toString(36)}:${Math.random().toString(36).slice(2, 6)}`,
    at: now,
    removedLabel,
    pairs,
    lonely,
    info,
    hidden: false,
  };
}

/** Re-derive an event after its pairs or affected set changed: narrow the pairs
 *  to those that still touch an affected node, recompute the lone ones, and
 *  return null when no affected node is left so the caller drops the event. The
 *  affected set is `info`'s keys (the single source of which nodes are marked). */
export function normalizeEvent(ev: BreakEvent): BreakEvent | null {
  const affected = new Set(Object.keys(ev.info));
  if (affected.size === 0) return null;
  const pairs = ev.pairs.filter((p) => affected.has(p.source) || affected.has(p.target));
  const lonely = [...affected].filter((id) => !pairs.some((p) => p.source === id || p.target === id));
  return { ...ev, pairs, lonely };
}

/** Resolve a node in an event (it got rebridged, was unlinked, or was deleted):
 *  drop it from the affected set and from every pair that touches it. */
export function resolveNodeInEvent(ev: BreakEvent, nodeId: string): BreakEvent | null {
  const info = { ...ev.info };
  delete info[nodeId];
  const pairs = ev.pairs.filter((p) => p.source !== nodeId && p.target !== nodeId);
  return normalizeEvent({ ...ev, info, pairs });
}

/** Node ids currently marked by any active alert (used to pulse them and raise
 *  their layer), with the worst severity across the events touching each one.
 *  The marked set is each event's affected neighbors (its `info` keys). */
export function alertedNodes(alerts: BreakEvent[] | undefined): Map<string, AlertSeverity> {
  const out = new Map<string, AlertSeverity>();
  for (const ev of alerts ?? []) {
    for (const [id, meta] of Object.entries(ev.info)) {
      if (meta.severity === "orphan" || !out.has(id)) out.set(id, meta.severity);
    }
  }
  return out;
}

/** Total count of affected nodes across all active alerts (for the status badge). */
export function alertCount(alerts: BreakEvent[] | undefined): number {
  return alertedNodes(alerts).size;
}
