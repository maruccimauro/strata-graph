import type { GraphModel, GraphNode, GraphEdge } from "../core/types";
import type { ViewerState } from "./api";

/** Merge the base (built-in model/scan) graph with the user's editor state into the
 *  concrete GraphModel the canvas renders: section overrides, saved positions,
 *  manual nodes/edges, removed auto edges, and the hide-missing preference. */
export function buildRenderModel(graph: GraphModel, state: ViewerState): GraphModel {
  const layout = state.prefs?.layout ?? "horizontal";
  const pos = state.pos?.[layout] ?? {};
  const overrides = state.sectionOverrides ?? {};
  const hues = state.sectionHues ?? {};
  const meta = state.nodeMeta ?? {};
  const hideMissing = state.prefs?.hideMissing ?? false;
  const seen = new Set(state.seenGenerated ?? []);

  const withMeta = (n: GraphNode): GraphNode => {
    const m = meta[n.id];
    if (!m) return n;
    return {
      ...n,
      createdAt: m.createdAt ?? n.createdAt,
      dueAt: m.dueAt ?? n.dueAt,
      locked: m.locked ?? n.locked,
    };
  };

  let nodes: GraphNode[] = graph.nodes.map((n) => {
    // a canon doc that was generated before but is now missing -> "unavailable"
    const status =
      n.kind === "doc" && n.origin === "auto" && n.status === "missing" && seen.has(n.id)
        ? "unavailable"
        : n.status;
    return withMeta({
      ...n,
      status,
      sectionId: overrides[n.id] ?? n.sectionId,
      position: pos[n.id] ?? n.position,
    });
  });
  for (const m of state.manualNodes ?? []) {
    nodes.push(withMeta({ ...m, position: pos[m.id] ?? m.position }));
  }
  if (hideMissing) nodes = nodes.filter((n) => n.status !== "missing");

  const nodeIds = new Set(nodes.map((n) => n.id));
  const removed = new Set(state.removedEdges ?? []);
  const edges: GraphEdge[] = graph.edges
    .filter((e) => !removed.has(e.id))
    .concat(state.manualEdges ?? [])
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  const sections = graph.sections.map((s) => (hues[s.id] !== undefined ? { ...s, hue: hues[s.id] } : s));

  return { ...graph, sections, nodes, edges };
}
