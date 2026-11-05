import type { GraphModel } from "../core/types";
import type { AlertRole, AlertSeverity, BreakEvent } from "./api";

const SEP = "\u0000";
const key = (p: { source: string; target: string }): string => `${p.source}${SEP}${p.target}`;

/** What deleting a node does to the nodes that depended on it (N-44). The model
 *  is dependent-centric: only the **dependents** (the outgoing side) are flagged
 *  and offered a reconnection; prerequisites are ignored. Computed from the
 *  current render model before the deletion is applied. */
export interface BreakAnalysis {
  /** outgoing neighbors that lose their prerequisite ("Required by"): the only
   *  nodes flagged, each reconnectable to one of the removed node's prerequisites. */
  dependents: string[];
  /** incoming neighbors (the removed node's prerequisites): offered only as
   *  reconnection targets, never flagged. */
  prereqs: string[];
  /** prerequisite -> dependent bridges: reconnect a dependent to one of the
   *  removed node's prerequisites. Only pairs whose edge does not already exist. */
  pairs: { source: string; target: string }[];
  /** dependents with no bridge candidate (the removed node had no prerequisites,
   *  or they already link to the dependent). */
  lonely: string[];
  /** per affected dependent: severity. `role` is always "dependent". */
  info: Record<string, { role: AlertRole; severity: AlertSeverity }>;
}

/** Analyze the relational impact of removing `id`: the dependents that lose it as
 *  a prerequisite, the prerequisites they can be reconnected to, and each
 *  dependent's severity once the node and its edges are gone. Comment edges are
 *  ignored (they are links, not dependencies). */
export function analyzeBreak(model: GraphModel, id: string): BreakAnalysis {
  const deps = model.edges.filter((e) => e.kind === "dependency");
  const prereqs = Array.from(new Set(deps.filter((e) => e.target === id).map((e) => e.source)));
  const dependents = Array.from(new Set(deps.filter((e) => e.source === id).map((e) => e.target)));

  // Remaining dependency degree per node once the removed node and its edges go
  // (severity: a dependent left with zero dependency edges is orphaned).
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

/** Build the persisted BreakEvent from an analysis and the bridges accepted at
 *  delete time. A dependent is flagged when no accepted bridge gives it a new
 *  prerequisite; the event keeps those dependents, the unresolved pairs that can
 *  still reconnect one of them, and the lone ones. Returns null when every
 *  dependent is covered. */
export function buildBreakEvent(
  analysis: BreakAnalysis,
  removedLabel: string,
  acceptedKeys: Set<string>,
  now: number,
): BreakEvent | null {
  const covered = new Set<string>();
  for (const p of analysis.pairs) if (acceptedKeys.has(key(p))) covered.add(p.target);
  const affected = analysis.dependents.filter((d) => !covered.has(d));
  if (affected.length === 0) return null;
  const aff = new Set(affected);

  const info: BreakEvent["info"] = {};
  for (const d of affected) info[d] = analysis.info[d];
  const pairs = analysis.pairs.filter((p) => !acceptedKeys.has(key(p)) && aff.has(p.target));
  const lonely = affected.filter((d) => !pairs.some((p) => p.target === d));

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

/** Re-derive an event after its affected set changed: narrow the pairs to those
 *  that still reconnect an affected dependent, recompute the lone ones, and
 *  return null when no dependent is left. The affected set is `info`'s keys. */
export function normalizeEvent(ev: BreakEvent): BreakEvent | null {
  const affected = new Set(Object.keys(ev.info));
  if (affected.size === 0) return null;
  const pairs = ev.pairs.filter((p) => affected.has(p.target));
  const lonely = [...affected].filter((d) => !pairs.some((p) => p.target === d));
  return { ...ev, pairs, lonely };
}

/** Resolve a dependent in an event (it got a new prerequisite, or was unlinked):
 *  drop it from the affected set and remove its reconnection options. This does
 *  not touch the other dependents. */
export function resolveDependent(ev: BreakEvent, nodeId: string): BreakEvent | null {
  const info = { ...ev.info };
  delete info[nodeId];
  const pairs = ev.pairs.filter((p) => p.target !== nodeId);
  return normalizeEvent({ ...ev, info, pairs });
}

/** Purge a deleted node from an event: it may be an affected dependent or a
 *  reconnection source, so drop it from both sides. */
export function purgeNode(ev: BreakEvent, nodeId: string): BreakEvent | null {
  const info = { ...ev.info };
  delete info[nodeId];
  const pairs = ev.pairs.filter((p) => p.source !== nodeId && p.target !== nodeId);
  return normalizeEvent({ ...ev, info, pairs });
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
