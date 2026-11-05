import type { GraphModel } from "../core/types";
import type { AlertRole, AlertSeverity, BreakEvent } from "./api";

/** What deleting a node does to its direct dependency neighbors (N-44). Computed
 *  from the current render model before the deletion is applied. */
export interface BreakAnalysis {
  /** prerequisite -> dependent bridges that would preserve a path through the
   *  removed node (direction kept: source was upstream, target downstream). Only
   *  pairs whose edge does not already exist are offered. */
  pairs: { source: string; target: string }[];
  /** affected neighbor ids that have no bridge candidate (a lone prerequisite
   *  with no dependents, or a lone dependent with no prerequisites). */
  lonely: string[];
  /** per affected neighbor id: role relative to the removed node and severity. */
  info: Record<string, { role: AlertRole; severity: AlertSeverity }>;
}

/** Analyze the relational impact of removing `id`: its direct dependency
 *  neighbors, the prerequisite -> dependent bridges that could keep the chain
 *  intact, and each neighbor's severity once the node and its edges are gone.
 *  Comment edges are ignored: they are plain links, not dependencies. */
export function analyzeBreak(model: GraphModel, id: string): BreakAnalysis {
  const deps = model.edges.filter((e) => e.kind === "dependency");
  const prereqs = Array.from(new Set(deps.filter((e) => e.target === id).map((e) => e.source)));
  const dependents = Array.from(new Set(deps.filter((e) => e.source === id).map((e) => e.target)));

  // Remaining dependency degree per node once the removed node and its edges go
  // (used for severity: a neighbor left with zero dependency edges is orphaned).
  const remaining = deps.filter((e) => e.source !== id && e.target !== id);
  const degree = new Map<string, number>();
  for (const e of remaining) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  const existing = new Set(remaining.map((e) => `${e.source}\u0000${e.target}`));
  const pairs: { source: string; target: string }[] = [];
  for (const a of prereqs) {
    for (const b of dependents) {
      if (a === b) continue; // would be a self-loop once bridged
      if (existing.has(`${a}\u0000${b}`)) continue; // the bridge is already there
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
    // A node that is both a prerequisite and a dependent of the removed node is
    // labelled by its prerequisite role (it sits upstream in the bridge).
    const role: AlertRole = prereqs.includes(n) ? "prereq" : "dependent";
    const severity: AlertSeverity = (degree.get(n) ?? 0) === 0 ? "orphan" : "partial";
    info[n] = { role, severity };
  }

  const lonely = [...neighbors].filter((n) => !inPair.has(n));
  return { pairs, lonely, info };
}

/** Build the persisted BreakEvent from an analysis and the set of bridges the
 *  user accepted at delete time. Accepted bridges are created as edges by the
 *  caller; the event keeps only the unresolved pairs and lonely neighbors, with
 *  info narrowed to the nodes that remain affected. Returns null when nothing is
 *  left unresolved (every bridge accepted and no lone neighbor). */
export function buildBreakEvent(
  analysis: BreakAnalysis,
  removedLabel: string,
  acceptedKeys: Set<string>,
  now: number,
): BreakEvent | null {
  const rejected = analysis.pairs.filter((p) => !acceptedKeys.has(`${p.source}\u0000${p.target}`));
  if (rejected.length === 0 && analysis.lonely.length === 0) return null;

  const affected = new Set<string>(analysis.lonely);
  for (const p of rejected) {
    affected.add(p.source);
    affected.add(p.target);
  }
  const info: BreakEvent["info"] = {};
  for (const n of affected) if (analysis.info[n]) info[n] = analysis.info[n];

  return {
    id: `brk:${now.toString(36)}:${Math.random().toString(36).slice(2, 6)}`,
    at: now,
    removedLabel,
    pairs: rejected,
    lonely: analysis.lonely,
    info,
    hidden: false,
  };
}

/** Re-derive an event's affected set after a pair or neighbor was resolved:
 *  narrow `info` to the nodes still referenced (by a pending pair or a lone id),
 *  and return null when nothing is left so the caller drops the event. */
export function normalizeEvent(ev: BreakEvent): BreakEvent | null {
  const affected = new Set<string>([...ev.lonely, ...ev.pairs.flatMap((p) => [p.source, p.target])]);
  if (affected.size === 0) return null;
  const info: BreakEvent["info"] = {};
  for (const id of affected) if (ev.info[id]) info[id] = ev.info[id];
  return { ...ev, info };
}

/** Node ids currently marked by any active alert (used to pulse them and raise
 *  their layer), with the worst severity across the events touching each one. */
export function alertedNodes(alerts: BreakEvent[] | undefined): Map<string, AlertSeverity> {
  const out = new Map<string, AlertSeverity>();
  for (const ev of alerts ?? []) {
    const ids = new Set<string>([...ev.lonely, ...ev.pairs.flatMap((p) => [p.source, p.target])]);
    for (const id of ids) {
      const sev = ev.info[id]?.severity ?? "partial";
      if (sev === "orphan" || !out.has(id)) out.set(id, sev);
    }
  }
  return out;
}

/** Total count of affected nodes across all active alerts (for the status badge). */
export function alertCount(alerts: BreakEvent[] | undefined): number {
  return alertedNodes(alerts).size;
}
