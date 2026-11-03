import { useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  SelectionMode,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeChange,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { GraphModel, GraphNode } from "../core/types";
import type { Prefs } from "./api";
import { applyDefaultLayout, computeBands } from "../core/layout";
import { BandNode } from "./nodes/BandNode";
import { SectionNode } from "./nodes/SectionNode";
import { DocNode, type Highlight } from "./nodes/DocNode";
import { CommentNode } from "./nodes/CommentNode";
import { FloatingEdge } from "./edges/FloatingEdge";
import { accent, ghostCol, mutedCol, upCol, downCol } from "./theme";

const nodeTypes: NodeTypes = {
  band: BandNode,
  section: SectionNode,
  doc: DocNode,
  comment: CommentNode,
};

const edgeTypes = { floating: FloatingEdge };

export interface StrataCanvasProps {
  model: GraphModel;
  prefs: Prefs;
  themeKey: number;
  onPersistPositions: (pos: Record<string, { x: number; y: number }>) => void;
  onConnectNodes: (source: string, target: string) => void;
  onActivateNode: (node: GraphNode, x: number, y: number) => void;
  onActivateEdge: (id: string, source: string, target: string, x: number, y: number) => void;
  onPaneClick: () => void;
  onCloseOverlays: () => void;
  onSelectionChange: (ids: string[]) => void;
  selectedEdge: string | null;
  onSelectEdge: (id: string | null) => void;
}

export function StrataCanvas(props: StrataCanvasProps) {
  const { model, prefs, themeKey, onPersistPositions, onConnectNodes, onActivateNode, onActivateEdge, onPaneClick, onCloseOverlays, onSelectionChange, selectedEdge, onSelectEdge } = props;
  const [selected, setSelected] = useState<string | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });

  const nodeIndex = useMemo(() => new Map(model.nodes.map((n) => [n.id, n])), [model]);
  const { rfNodes, rfEdges } = useMemo(
    () => build(model, prefs, selected, selectedEdge),
    [model, prefs, selected, selectedEdge, themeKey],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);
  // Rebuilding from rfNodes would drop React Flow's own selection flags, which
  // breaks multi-select (N-10) and deselects a group on drop (N-17). Carry the
  // current selection across each rebuild.
  useEffect(
    () =>
      setNodes((prev) => {
        const sel = new Set(prev.filter((n) => n.selected).map((n) => n.id));
        return sel.size ? rfNodes.map((n) => (sel.has(n.id) ? { ...n, selected: true } : n)) : rfNodes;
      }),
    [rfNodes, setNodes],
  );
  useEffect(() => setEdges(rfEdges), [rfEdges, setEdges]);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };

  const onNodeClick: NodeMouseHandler = (_e, node) => {
    if (node.type === "band" || node.type === "section") return;
    setSelected((cur) => (cur === node.id ? null : node.id));
  };
  const onNodeDoubleClick: NodeMouseHandler = (e, node) => {
    const g = nodeIndex.get(node.id);
    if (g && node.type !== "band") onActivateNode(g, e.clientX, e.clientY);
  };
  const onNodeMouseEnter: NodeMouseHandler = (e, node) => {
    if (node.type === "band") return;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    clearHover();
    hoverTimer.current = setTimeout(() => {
      // N-11: if the pointer is over the node border (handle zone), skip the
      // overlay — the user is most likely starting an edge from a handle.
      const el = document.querySelector(`.react-flow__node[data-id="${CSS.escape(node.id)}"]`);
      const { x, y } = lastPointer.current;
      if (el) {
        const r = el.getBoundingClientRect();
        // Adaptive border band so short nodes keep a usable center (handles sit
        // on the edges; hovering them should not pop the overlay).
        const mx = Math.min(12, r.width * 0.3);
        const my = Math.min(12, r.height * 0.3);
        if (x - r.left < mx || r.right - x < mx || y - r.top < my || r.bottom - y < my) return;
      }
      const g = nodeIndex.get(node.id);
      if (g) onActivateNode(g, x, y);
    }, 450);
  };
  const onNodeMouseMove: NodeMouseHandler = (e) => {
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };
  const onEdgeMouseEnter: EdgeMouseHandler = (e, edge) => {
    const { clientX, clientY } = e;
    clearHover();
    hoverTimer.current = setTimeout(() => onActivateEdge(edge.id, edge.source, edge.target, clientX, clientY), 400);
  };
  // Click a dependency/comment edge to select it; pressing Delete then removes
  // it (handled in Editor). Auto branch edges are not selectable (not deletable).
  const onEdgeClick: EdgeMouseHandler = (e, edge) => {
    e.stopPropagation();
    if (edge.id.startsWith("branch:")) return;
    onSelectEdge(selectedEdge === edge.id ? null : edge.id);
  };

  // Section central node moves along one axis only: horizontal layout locks Y
  // (slides left-right), vertical layout locks X (slides up-down).
  const vertical = prefs.layout === "vertical";
  const handleNodesChange = (changes: NodeChange[]) => {
    const fixed = changes.map((ch) => {
      if (ch.type === "position" && ch.position && ch.id.startsWith("section:")) {
        const cur = nodes.find((n) => n.id === ch.id);
        if (cur) {
          const locked = vertical
            ? { x: cur.position.x, y: ch.position.y }
            : { x: ch.position.x, y: cur.position.y };
          return { ...ch, position: locked };
        }
      }
      return ch;
    });
    onNodesChange(fixed);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onNodeMouseEnter={onNodeMouseEnter}
      onNodeMouseMove={onNodeMouseMove}
      onNodeMouseLeave={clearHover}
      onSelectionChange={({ nodes: sel }) => onSelectionChange(sel.filter((n) => n.type !== "band").map((n) => n.id))}
      onEdgeMouseEnter={onEdgeMouseEnter}
      onEdgeMouseLeave={clearHover}
      onEdgeClick={onEdgeClick}
      onPaneClick={() => {
        setSelected(null);
        onSelectEdge(null);
        onPaneClick();
      }}
      onMoveStart={() => onCloseOverlays()}
      onConnect={(c) => {
        if (c.source && c.target && c.source !== c.target) onConnectNodes(c.source, c.target);
      }}
      onNodeDragStop={() => {
        const pos: Record<string, { x: number; y: number }> = {};
        for (const n of nodes) {
          if (n.type === "band") continue;
          pos[n.id] = { x: n.position.x, y: n.position.y };
        }
        onPersistPositions(pos);
      }}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionMode={ConnectionMode.Loose}
      connectionRadius={34}
      fitView
      minZoom={0.2}
      maxZoom={2}
      selectionOnDrag
      panOnDrag={[1]}
      panOnScroll={false}
      selectionMode={SelectionMode.Partial}
      multiSelectionKeyCode={["Meta", "Control", "Shift"]}
      selectionKeyCode={null}
      deleteKeyCode={null}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={24} />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}

function reach(map: Map<string, string[]>, start: string): Set<string> {
  const out = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const c = stack.pop()!;
    for (const n of map.get(c) ?? []) {
      if (!out.has(n)) {
        out.add(n);
        stack.push(n);
      }
    }
  }
  return out;
}

function build(model: GraphModel, prefs: Prefs, selected: string | null, selectedEdge: string | null): { rfNodes: Node[]; rfEdges: Edge[] } {
  const orientation = prefs.layout ?? "horizontal";
  const laid = applyDefaultLayout(model, orientation);
  const sectionHue = new Map(laid.sections.map((s) => [s.id, s.hue]));
  const bands = computeBands(laid, orientation);
  const byId = new Map(laid.nodes.map((n) => [n.id, n]));

  // adjacency over dependency + branch edges (for highlight)
  const up = new Map<string, string[]>();
  const down = new Map<string, string[]>();
  const push = (m: Map<string, string[]>, k: string, v: string) => {
    const arr = m.get(k);
    if (arr) arr.push(v);
    else m.set(k, [v]);
  };
  for (const e of laid.edges)
    if (e.kind === "dependency") {
      push(down, e.source, e.target);
      push(up, e.target, e.source);
    }

  // counts for section centrals
  const auto = new Map<string, { gen: number; total: number }>();
  const manual = new Map<string, number>();
  for (const n of laid.nodes) {
    if (n.kind !== "doc" || !n.sectionId) continue;
    if (n.origin === "manual") {
      manual.set(n.sectionId, (manual.get(n.sectionId) ?? 0) + 1);
      continue;
    }
    if (n.status === "unavailable") continue;
    const a = auto.get(n.sectionId) ?? { gen: 0, total: 0 };
    a.total += 1;
    if (n.status === "generated") a.gen += 1;
    auto.set(n.sectionId, a);
  }

  const anc = selected ? reach(up, selected) : new Set<string>();
  const desc = selected ? reach(down, selected) : new Set<string>();
  const hlOf = (id: string): Highlight => {
    if (!selected) return undefined;
    if (id === selected) return "sel";
    if (anc.has(id)) return "anc";
    if (desc.has(id)) return "desc";
    return undefined;
  };
  const dimmed = (id: string): boolean =>
    !!selected && id !== selected && !anc.has(id) && !desc.has(id);

  const rfNodes: Node[] = [];
  for (const b of bands) {
    rfNodes.push({
      id: `band:${b.section.id}`,
      type: "band",
      position: { x: b.x, y: b.y },
      data: { label: b.section.label, hue: b.section.hue },
      draggable: false,
      selectable: false,
      connectable: false,
      zIndex: -1,
      style: { width: b.width, height: b.height },
    });
  }
  for (const n of laid.nodes) {
    const hue = n.sectionId ? (sectionHue.get(n.sectionId) ?? 210) : 210;
    const dim = dimmed(n.id) ? { opacity: 0.18 } : undefined;
    if (n.kind === "section") {
      const a = auto.get(n.sectionId!) ?? { gen: 0, total: 0 };
      rfNodes.push({
        id: n.id,
        type: "section",
        position: n.position!,
        data: { label: n.label, hue, autoCount: a.gen, autoTotal: a.total, manualCount: manual.get(n.sectionId!) ?? 0, locked: n.locked },
        draggable: !n.locked,
        zIndex: 1,
        style: dim,
      });
    } else if (n.kind === "comment") {
      rfNodes.push({
        id: n.id,
        type: "comment",
        position: n.position!,
        data: { label: n.label, note: n.note, ref: n.files?.[0]?.path, locked: n.locked, dueAt: n.dueAt },
        draggable: !n.locked,
        zIndex: 2,
        style: dim,
      });
    } else {
      rfNodes.push({
        id: n.id,
        type: "doc",
        position: n.position!,
        data: { label: n.label, hue, status: n.status, origin: n.origin, hl: hlOf(n.id), locked: n.locked, dueAt: n.dueAt },
        draggable: !n.locked,
        zIndex: 1,
        style: dim,
      });
    }
  }

  // edges
  const incoming = new Set(laid.edges.filter((e) => e.kind === "dependency").map((e) => e.target));
  const rfEdges: Edge[] = [];
  const edgeHL = (e: { source: string; target: string }): "up" | "down" | "none" => {
    if (!selected) return "none";
    const toSel = e.target === selected || anc.has(e.target);
    const fromAnc = e.source === selected || anc.has(e.source);
    if (toSel && fromAnc) return "up";
    const fromSel = e.source === selected || desc.has(e.source);
    const toDesc = e.target === selected || desc.has(e.target);
    if (fromSel && toDesc) return "down";
    return "none";
  };

  for (const e of laid.edges) {
    if (e.kind === "comment") {
      const sel = e.id === selectedEdge;
      rfEdges.push({
        id: e.id,
        type: "floating",
        source: e.source,
        target: e.target,
        style: sel
          ? { stroke: "#caa83a", strokeWidth: 3, strokeDasharray: "2 3", opacity: 1 }
          : { stroke: "#caa83a", strokeWidth: 1.5, strokeDasharray: "2 3", opacity: 0.6 },
      });
      continue;
    }
    if (!prefs.showDeps) continue;
    const tgt = byId.get(e.target);
    const src = byId.get(e.source);
    const ghost = src?.status === "missing" || tgt?.status === "missing";
    const hue = tgt?.sectionId ? (sectionHue.get(tgt.sectionId) ?? 210) : 210;
    const baseColor = ghost ? ghostCol() : prefs.edgeColor === "neutral" ? mutedCol() : accent(hue);
    const hl = edgeHL(e);
    const base =
      hl === "up"
        ? { stroke: upCol(), strokeWidth: 2.6, opacity: 1 }
        : hl === "down"
          ? { stroke: downCol(), strokeWidth: 2.6, opacity: 1, strokeDasharray: "6 4" }
          : {
              stroke: baseColor,
              strokeWidth: 1.6,
              strokeDasharray: ghost ? "5 4" : undefined,
              opacity: selected ? 0.07 : ghost ? 0.5 : 0.55,
            };
    // A selected edge is drawn bold and solid so it reads as the delete target.
    const style = e.id === selectedEdge ? { ...base, strokeWidth: 3.4, opacity: 1, strokeDasharray: undefined } : base;
    rfEdges.push({
      id: e.id,
      type: "floating",
      source: e.source,
      target: e.target,
      style,
      data: { originDot: true },
      markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke as string },
    });
  }

  // branch edges from section central to root docs
  for (const n of laid.nodes) {
    if (n.kind !== "doc" || incoming.has(n.id)) continue;
    if (!n.sectionId) continue;
    rfEdges.push({
      id: `branch:${n.id}`,
      type: "floating",
      source: `section:${n.sectionId}`,
      target: n.id,
      style: { stroke: mutedCol(), strokeWidth: 1.2, opacity: dimmed(n.id) ? 0.05 : 0.22 },
    });
  }

  return { rfNodes, rfEdges };
}
