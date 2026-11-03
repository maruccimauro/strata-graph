import type { GraphModel, GraphNode, GraphEdge, Template } from "../../core/types";
import type { ScanResult } from "../../server/scanner";
import { SECTIONS, DOCUMENTS, EDGES } from "./canon";

export const sdlcTemplate: Template = {
  id: "sdlc",
  label: "Software Delivery Lifecycle",
  sections: SECTIONS,
};

const DEMO_GENERATED = new Set([
  "decision-log",
  "action-items",
  "problem-statement",
  "business-case",
  "stakeholder-map",
  "preliminary-scope",
  "traceability-matrix",
  "nfr-slo",
]);

/**
 * Build a GraphModel from the SDLC canon. With a `scan` (connected mode) it
 * reflects the real docs/ state, extra files and link-based edges; without one
 * it uses a small demo status mix so the editor renders something concrete.
 */
export function buildSdlcModel(opts?: { name?: string; scan?: ScanResult }): GraphModel {
  const scan = opts?.scan;

  const sectionNodes: GraphNode[] = SECTIONS.map((s) => ({
    id: `section:${s.id}`,
    label: s.label,
    kind: "section",
    sectionId: s.id,
    origin: "auto",
    status: "generated",
  }));

  const docNodes: GraphNode[] = DOCUMENTS.map((d) => {
    const gen = scan ? scan.generated[d.id] : undefined;
    const status = scan
      ? gen
        ? "generated"
        : "missing"
      : DEMO_GENERATED.has(d.id)
        ? "generated"
        : "missing";
    return {
      id: d.id,
      label: d.label,
      kind: "doc",
      sectionId: d.section,
      origin: "auto",
      status,
      files: gen ? [{ path: gen.path, abspath: gen.abspath }] : undefined,
    };
  });

  const extraNodes: GraphNode[] = (scan?.extras ?? []).map((e) => ({
    id: e.id,
    label: e.label,
    kind: "doc",
    sectionId: e.section,
    origin: "auto",
    status: "generated",
    files: [{ path: e.path, abspath: e.abspath }],
  }));

  const edgeKeys = new Set<string>();
  const edges: GraphEdge[] = [];
  const addEdge = (source: string, target: string, via: "template" | "link") => {
    const key = `${source}->${target}`;
    if (source === target || edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ id: `e:${key}`, source, target, kind: "dependency", origin: "auto", via });
  };
  for (const [s, t] of EDGES) addEdge(s, t, "template");
  for (const [s, t] of scan?.linkEdges ?? []) addEdge(s, t, "link");

  return {
    meta: { name: opts?.name ?? scan?.name ?? "Demo project", template: "sdlc" },
    sections: SECTIONS,
    nodes: [...sectionNodes, ...docNodes, ...extraNodes],
    edges,
  };
}
