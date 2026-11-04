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
  selected: string | null;
  onSelectNode: (id: string | null) => void;
  selectedEdge: string | null;
  onSelectEdge: (id: string | null) => void;
  onReconnectEdge: (edgeId: string, source: string, target: string) => void;
  onPaneContextMenu: (x: number, y: number) => void;
  onNodeContextMenu: (node: GraphNode, x: number, y: number) => void;
  onEdgeContextMenu: (id: string, source: string, target: string, x: number, y: number) => void;
}

export function StrataCanvas(props: StrataCanvasProps) {
  const { model, prefs, themeKey, onPersistPositions, onConnectNodes, onActivateNode, onActivateEdge, onPaneClick, onCloseOverlays, onSelectionChange, selected, onSelectNode, selectedEdge, onSelectEdge, onReconnectEdge, onPaneContextMenu, onNodeContextMenu, onEdgeContextMenu } = props;

  // Transient hover highlight (N-30): a selection always wins; otherwise, when
  // the toggle is on, the hovered node/edge drives the same highlight visual.
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const hlNode = selected ?? (prefs.hoverHighlight ? hoverNode : null);
  const hlEdge = selectedEdge ?? (prefs.hoverHighlight ? hoverEdge : null);

  const nodeIndex = useMemo(() => new Map(model.nodes.map((n) => [n.id, n])), [model]);
  const { rfNodes, rfEdges } = useMemo(
    () => build(model, prefs, hlNode, hlEdge, selectedEdge),
    [model, prefs, hlNode, hlEdge, selectedEdge, themeKey],
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

  // Primary-click interaction model (N-26): a single click selects, a double
  // click opens the overlay (sticky), and Alt + hover opens it transiently.
  // There is no hover-to-open timer and no move-away auto-hide.
  const altDown = useRef(false);
  const transientNode = useRef<string | null>(null);
  const transientEdge = useRef<string | null>(null);

  const closeTransient = () => {
    if (!transientNode.current && !transientEdge.current) return;
    transientNode.current = null;
    transientEdge.current = null;
    onCloseOverlays();
  };

  // Track the Alt key globally so entering a node/edge can open a transient
  // overlay; releasing Alt (or losing window focus) closes any transient one.
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      // preventDefault stops the browser from moving focus to its own menu bar
      // when Alt is tapped on its own (which otherwise swallows the next hover
      // and keystroke until the page is clicked again).
      if (e.key === "Alt") {
        altDown.current = true;
        e.preventDefault();
      }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.key !== "Alt") return;
      e.preventDefault();
      altDown.current = false;
      closeTransient();
    };
    const blur = () => {
      altDown.current = false;
      closeTransient();
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
    };
    // onCloseOverlays is stable; the refs are mutable and need no deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCloseOverlays]);

  const onNodeClick: NodeMouseHandler = (_e, node) => {
    // A single click always dismisses an open (sticky) overlay. Section bands
    // cover the canvas and never reach onPaneClick, so a click on a band acts
    // like a click on empty space: close and deselect.
    onCloseOverlays();
    if (node.type === "band") {
      onSelectNode(null);
      onSelectEdge(null);
      return;
    }
    if (node.type === "section") return;
    onSelectEdge(null);
    onSelectNode(selected === node.id ? null : node.id);
  };
  const onNodeDoubleClick: NodeMouseHandler = (e, node) => {
    if (node.type === "band") return;
    const g = nodeIndex.get(node.id);
    if (!g) return;
    // Becoming sticky: drop transient tracking so a later leave/Alt-up keeps it.
    transientNode.current = null;
    transientEdge.current = null;
    if (node.type !== "section") {
      onSelectEdge(null);
      onSelectNode(node.id);
    }
    onActivateNode(g, e.clientX, e.clientY);
  };
  const openTransientNode: NodeMouseHandler = (e, node) => {
    if (!altDown.current || node.type === "band") return;
    if (transientNode.current === node.id) return;
    const g = nodeIndex.get(node.id);
    if (!g) return;
    transientNode.current = node.id;
    transientEdge.current = null;
    onActivateNode(g, e.clientX, e.clientY);
  };
  const onNodeMouseEnter: NodeMouseHandler = (e, node) => {
    if (prefs.hoverHighlight && node.type !== "band") {
      setHoverNode(node.type === "section" ? null : node.id);
    }
    openTransientNode(e, node);
  };
  const onNodeMouseLeave: NodeMouseHandler = (_e, node) => {
    setHoverNode((cur) => (cur === node.id ? null : cur));
    if (transientNode.current) closeTransient();
  };

  const openTransientEdge: EdgeMouseHandler = (e, edge) => {
    if (!altDown.current || edge.id.startsWith("branch:")) return;
    if (transientEdge.current === edge.id) return;
    transientEdge.current = edge.id;
    transientNode.current = null;
    onActivateEdge(edge.id, edge.source, edge.target, e.clientX, e.clientY);
  };
  const onEdgeMouseEnter: EdgeMouseHandler = (e, edge) => {
    if (prefs.hoverHighlight && !edge.id.startsWith("branch:")) setHoverEdge(edge.id);
    openTransientEdge(e, edge);
  };
  const onEdgeMouseLeave: EdgeMouseHandler = (_e, edge) => {
    setHoverEdge((cur) => (cur === edge.id ? null : cur));
    if (transientEdge.current) closeTransient();
  };
  // Click a dependency/comment edge to select it; pressing Delete then removes
  // it (handled in Editor). Double click opens its overlay (sticky). Auto branch
  // edges are not selectable and have no overlay.
  const onEdgeClick: EdgeMouseHandler = (e, edge) => {
    e.stopPropagation();
    onCloseOverlays();
    if (edge.id.startsWith("branch:")) {
      onSelectNode(null);
      onSelectEdge(null);
      return;
    }
    onSelectNode(null);
    onSelectEdge(selectedEdge === edge.id ? null : edge.id);
  };
  const onEdgeDoubleClick: EdgeMouseHandler = (e, edge) => {
    e.stopPropagation();
    if (edge.id.startsWith("branch:")) return;
    transientNode.current = null;
    transientEdge.current = null;
    onSelectNode(null);
    onSelectEdge(edge.id);
    onActivateEdge(edge.id, edge.source, edge.target, e.clientX, e.clientY);
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
      onNodeMouseMove={openTransientNode}
      onNodeMouseLeave={onNodeMouseLeave}
      onSelectionChange={({ nodes: sel }) => onSelectionChange(sel.filter((n) => n.type !== "band").map((n) => n.id))}
      onEdgeMouseEnter={onEdgeMouseEnter}
      onEdgeMouseMove={openTransientEdge}
      onEdgeMouseLeave={onEdgeMouseLeave}
      onEdgeClick={onEdgeClick}
      onEdgeDoubleClick={onEdgeDoubleClick}
      onPaneContextMenu={(e) => {
        e.preventDefault();
        onPaneContextMenu(e.clientX, e.clientY);
      }}
      onNodeContextMenu={(e, node) => {
        e.preventDefault();
        const g = node.type === "band" ? undefined : nodeIndex.get(node.id);
        if (g) onNodeContextMenu(g, e.clientX, e.clientY);
        else onPaneContextMenu(e.clientX, e.clientY);
      }}
      onEdgeContextMenu={(e, edge) => {
        e.preventDefault();
        if (edge.id.startsWith("branch:")) {
          onPaneContextMenu(e.clientX, e.clientY);
          return;
        }
        onEdgeContextMenu(edge.id, edge.source, edge.target, e.clientX, e.clientY);
      }}
      onReconnectStart={() => {
        transientNode.current = null;
        transientEdge.current = null;
        onCloseOverlays();
      }}
      onReconnect={(oldEdge, conn) => {
        if (!conn.source || !conn.target || conn.source === conn.target) return;
        onReconnectEdge(oldEdge.id, conn.source, conn.target);
      }}
      onPaneClick={() => {
        onSelectNode(null);
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

/** Glow used to mark a selected edge: a soft halo in the edge color instead of a
 *  heavy stroke. */
function glowFilter(color: string): string {
  return `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 5px ${color})`;
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

function build(model: GraphModel, prefs: Prefs, selected: string | null, highlightEdge: string | null, selectedEdge: string | null): { rfNodes: Node[]; rfEdges: Edge[] } {
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
      // glow on hover or selection; the reconnect-anchor class only on selection
      const glow = e.id === highlightEdge;
      const sel = e.id === selectedEdge;
      rfEdges.push({
        id: e.id,
        type: "floating",
        source: e.source,
        target: e.target,
        style: glow
          ? { stroke: "#caa83a", strokeWidth: 1.8, strokeDasharray: "2 3", opacity: 1, filter: glowFilter("#caa83a") }
          : { stroke: "#caa83a", strokeWidth: 1.5, strokeDasharray: "2 3", opacity: 0.6 },
        className: sel ? "edge-selected" : undefined,
        data: { kind: "comment" },
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
    // A highlighted edge (hovered or selected) keeps its weight but gains a glow
    // in its own effective color, so it reads as active without a heavy stroke.
    const style =
      e.id === highlightEdge
        ? { ...base, strokeWidth: Math.max(base.strokeWidth, 2), opacity: 1, filter: glowFilter(base.stroke) }
        : base;
    rfEdges.push({
      id: e.id,
      type: "floating",
      source: e.source,
      target: e.target,
      style,
      className: e.id === selectedEdge ? "edge-selected" : undefined,
      data: { originDot: true, kind: "dependency" },
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
      reconnectable: false,
      style: { stroke: mutedCol(), strokeWidth: 1.2, opacity: dimmed(n.id) ? 0.05 : 0.22 },
    });
  }

  return { rfNodes, rfEdges };
}
