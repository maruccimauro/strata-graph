import type { GraphModel, GraphNode, GraphEdge } from "../core/types";
import type { ViewerState } from "./api";

/** Merge the base (built-in model/scan) graph with the user's editor state into the
 *  concrete GraphModel the canvas renders: section overrides, saved positions,
 *  manual nodes/edges, and removed auto nodes/edges. Not-generated nodes are always kept
 *  in the model; the dim-missing preference only fades them at render time. */
export function buildRenderModel(graph: GraphModel, state: ViewerState): GraphModel {
  const layout = state.prefs?.layout ?? "horizontal";
  const pos = state.pos?.[layout] ?? {};
  const overrides = state.sectionOverrides ?? {};
  const hues = state.sectionHues ?? {};
  const labels = state.sectionLabels ?? {};
  const meta = state.nodeMeta ?? {};
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

  const removedNodes = new Set(state.removedNodes ?? []);
  const nodes: GraphNode[] = graph.nodes
    .filter((n) => !removedNodes.has(n.id))
    .map((n) => {
      // a canon doc that was generated before but is now missing -> "unavailable"
      const status =
        n.kind === "doc" && n.origin === "auto" && n.status === "missing" && seen.has(n.id)
          ? "unavailable"
          : n.status;
      // the central (section-kind) node mirrors its section's label override.
      const label = n.kind === "section" && n.sectionId && labels[n.sectionId] !== undefined ? labels[n.sectionId] : n.label;
      return withMeta({
        ...n,
        label,
        status,
        sectionId: overrides[n.id] ?? n.sectionId,
        position: pos[n.id] ?? n.position,
      });
    });
  for (const m of state.manualNodes ?? []) {
    nodes.push(withMeta({ ...m, position: pos[m.id] ?? m.position }));
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const removed = new Set(state.removedEdges ?? []);
  const edges: GraphEdge[] = graph.edges
    .filter((e) => !removed.has(e.id))
    .concat(state.manualEdges ?? [])
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  const orders = state.sectionOrder ?? {};
  const sections = graph.sections.map((s) => {
    const hue = hues[s.id];
    const label = labels[s.id];
    const order = orders[s.id];
    if (hue === undefined && label === undefined && order === undefined) return s;
    return { ...s, hue: hue ?? s.hue, label: label ?? s.label, order: order ?? s.order };
  });

  return { ...graph, sections, nodes, edges };
}
