import { useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  SelectionMode,
  ConnectionMode,
  ViewportPortal,
  useReactFlow,
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
import { applyDefaultLayout, computeBands, GEO } from "../core/layout";
import { BandNode } from "./nodes/BandNode";
import { SectionNode } from "./nodes/SectionNode";
import { DocNode, type Highlight } from "./nodes/DocNode";
import { CommentNode } from "./nodes/CommentNode";
import { FloatingEdge } from "./edges/FloatingEdge";
import { borderPointToward } from "./edges/floating";
import { accent, ghostCol, mutedCol, upCol, downCol } from "./theme";

/** Active edge retarget: one endpoint follows the cursor while the other stays
 *  fixed; a click on a node commits the new endpoint (see N-25 in the tracker). */
export interface Retarget {
  edgeId: string;
  movingEnd: "source" | "target";
  fixedNodeId: string;
}

const nodeTypes: NodeTypes = {
  band: BandNode,
  section: SectionNode,
  doc: DocNode,
  comment: CommentNode,
};

const edgeTypes = { floating: FloatingEdge };

const clamp = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), max);

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
  retarget: Retarget | null;
  onRetargetPick: (nodeId: string) => void;
  onRetargetCancel: () => void;
  onAnchorRetarget: (id: string, source: string, target: string, end: "source" | "target", x: number, y: number) => void;
  onPaneContextMenu: (x: number, y: number) => void;
  onNodeContextMenu: (node: GraphNode, x: number, y: number) => void;
  onEdgeContextMenu: (id: string, source: string, target: string, x: number, y: number) => void;
}

export function StrataCanvas(props: StrataCanvasProps) {
  const { model, prefs, themeKey, onPersistPositions, onConnectNodes, onActivateNode, onActivateEdge, onPaneClick, onCloseOverlays, onSelectionChange, selected, onSelectNode, selectedEdge, onSelectEdge, retarget, onRetargetPick, onRetargetCancel, onAnchorRetarget, onPaneContextMenu, onNodeContextMenu, onEdgeContextMenu } = props;
  const rf = useReactFlow();
  // Cursor position in flow coordinates while a retarget is in progress, so the
  // rubber-band line can follow it from the fixed endpoint.
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // Transient hover highlight (N-30): a selection always wins; otherwise, when
  // the toggle is on, the hovered node/edge drives the same highlight visual.
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const hoverN = prefs.hoverHighlight ? hoverNode : null;
  const hoverE = prefs.hoverHighlight ? hoverEdge : null;

  const nodeIndex = useMemo(() => new Map(model.nodes.map((n) => [n.id, n])), [model]);
  // Layout + adjacency, independent of selection and hover.
  const info = useMemo(() => graphInfo(model, prefs.layout ?? "horizontal"), [model, prefs.layout]);
  // Nodes depend only on the real selection, never on hover, so hovering a node
  // rebuilds edges only (no node flicker) and highlights edges, not the node.
  const rfNodes = useMemo(() => buildNodes(info, selected, prefs.autoGrowBands), [info, selected, prefs.autoGrowBands, themeKey]);
  const rfEdges = useMemo(
    () => buildEdges(info, prefs, selected, hoverN, selectedEdge, hoverE, onAnchorRetarget, retarget?.edgeId ?? null),
    [info, prefs, selected, hoverN, selectedEdge, hoverE, onAnchorRetarget, retarget, themeKey],
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
      } else if (e.key === "Escape") {
        // Clear the hover highlight too, so pressing Escape over a selected edge
        // visibly removes its glow instead of leaving the hover glow behind.
        setHoverNode(null);
        setHoverEdge(null);
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

  // While a retarget is active, track the cursor in flow coordinates so the
  // rubber-band can follow it even over nodes (onPaneMouseMove would not fire
  // there). Clear it when the retarget ends.
  useEffect(() => {
    if (!retarget) {
      setCursor(null);
      return;
    }
    const mm = (e: MouseEvent) => setCursor(rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    window.addEventListener("mousemove", mm);
    return () => window.removeEventListener("mousemove", mm);
  }, [retarget, rf]);

  const onNodeClick: NodeMouseHandler = (_e, node) => {
    // While retargeting an edge, a click picks the new endpoint instead of
    // selecting. Only document nodes are valid targets, and never the fixed end.
    if (retarget) {
      if (node.type === "doc" && node.id !== retarget.fixedNodeId) onRetargetPick(node.id);
      return;
    }
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

  // Section central node moves only across its band (the band's short axis) and
  // stays anchored on the long axis: horizontal layout (rows) locks X and slides
  // up-down; vertical layout (columns) locks Y and slides left-right. The central
  // is a child of its band, so its position is relative to the band origin and the
  // moving coordinate is clamped to [0, band short side - central short side].
  const vertical = prefs.layout === "vertical";
  const bandBySection = useMemo(() => new Map(info.bands.map((b) => [b.section.id, b])), [info.bands]);
  const handleNodesChange = (changes: NodeChange[]) => {
    const fixed = changes.map((ch) => {
      if (ch.type === "position" && ch.position && ch.id.startsWith("section:")) {
        const cur = nodes.find((n) => n.id === ch.id);
        if (cur) {
          const band = bandBySection.get(ch.id.slice("section:".length));
          if (vertical) {
            const maxX = band ? Math.max(0, band.width - GEO.SECTION_W) : ch.position.x;
            return { ...ch, position: { x: clamp(ch.position.x, 0, maxX), y: cur.position.y } };
          }
          const maxY = band ? Math.max(0, band.height - GEO.SECTION_H) : ch.position.y;
          return { ...ch, position: { x: cur.position.x, y: clamp(ch.position.y, 0, maxY) } };
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
      onPaneClick={() => {
        // Clicking empty space during a retarget cancels it (restores the edge
        // and reopens its overlay); otherwise it clears the selection.
        if (retarget) {
          onRetargetCancel();
          return;
        }
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
          // Children (nodes inside a band) store band-relative coordinates; clamp
          // so a drag never pushes them above/left of their band origin. Top-level
          // nodes (comments, sectionless docs) stay in absolute coordinates.
          pos[n.id] = n.parentId
            ? { x: Math.max(0, n.position.x), y: Math.max(0, n.position.y) }
            : { x: n.position.x, y: n.position.y };
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
      style={retarget ? { cursor: "crosshair" } : undefined}
    >
      <Background gap={24} />
      <Controls />
      <MiniMap pannable zoomable />
      {retarget &&
        cursor &&
        (() => {
          const node = rf.getInternalNode(retarget.fixedNodeId);
          if (!node) return null;
          const p = borderPointToward(node, cursor.x, cursor.y);
          const col = accent(210);
          return (
            <ViewportPortal>
              <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
                <line x1={p.x} y1={p.y} x2={cursor.x} y2={cursor.y} stroke={col} strokeWidth={2} strokeDasharray="5 4" />
                <circle cx={cursor.x} cy={cursor.y} r={4} fill={col} />
              </svg>
            </ViewportPortal>
          );
        })()}
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

/** Layout, section hues, adjacency and section counts — everything derived from
 *  the model (and orientation) alone, independent of selection and hover. */
function graphInfo(model: GraphModel, orientation: "horizontal" | "vertical") {
  const laid = applyDefaultLayout(model, orientation);
  const sectionHue = new Map(laid.sections.map((s) => [s.id, s.hue]));
  const bands = computeBands(laid, orientation);
  const byId = new Map(laid.nodes.map((n) => [n.id, n]));

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

  const incoming = new Set(laid.edges.filter((e) => e.kind === "dependency").map((e) => e.target));
  return { laid, sectionHue, bands, byId, up, down, auto, manual, incoming };
}

type GraphInfo = ReturnType<typeof graphInfo>;

/** Direction of an edge relative to a focus node: "up" when it lies on a path
 *  reaching the node (a prerequisite), "down" when it lies on a path leaving it. */
function edgeDir(
  e: { source: string; target: string },
  node: string | null,
  anc: Set<string>,
  desc: Set<string>,
): "up" | "down" | "none" {
  if (!node) return "none";
  const toN = e.target === node || anc.has(e.target);
  const fromAnc = e.source === node || anc.has(e.source);
  if (toN && fromAnc) return "up";
  const fromN = e.source === node || desc.has(e.source);
  const toDesc = e.target === node || desc.has(e.target);
  if (fromN && toDesc) return "down";
  return "none";
}

/** Nodes depend only on the real selection: a selected node dims the unrelated
 *  nodes and marks its own chain. Hover never affects nodes. */
function buildNodes(info: GraphInfo, selected: string | null, autoGrow: boolean): Node[] {
  const { laid, sectionHue, bands, up, down, auto, manual } = info;
  // A child node's band must exist in the array (and before it) for React Flow,
  // so only parent a node whose section actually has a band.
  const bandIds = new Set(bands.map((b) => b.section.id));
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
        // Child of its band (relative coordinates); the central never grows the
        // band, so no expandParent. Its cross-axis clamp lives in handleNodesChange.
        parentId: n.sectionId && bandIds.has(n.sectionId) ? `band:${n.sectionId}` : undefined,
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
      // A document with a section is a child of its band (relative coordinates).
      // With auto-grow on, expandParent grows the band live as the node is dragged
      // past the edge; with it off, extent "parent" confines the node to the band.
      // Sectionless manual docs stay top-level in absolute coordinates.
      rfNodes.push({
        id: n.id,
        type: "doc",
        position: n.position!,
        ...(n.sectionId && bandIds.has(n.sectionId)
          ? { parentId: `band:${n.sectionId}`, ...(autoGrow ? { expandParent: true } : { extent: "parent" as const }) }
          : {}),
        data: { label: n.label, hue, status: n.status, origin: n.origin, hl: hlOf(n.id), locked: n.locked, dueAt: n.dueAt },
        draggable: !n.locked,
        zIndex: 1,
        style: dim,
      });
    }
  }
  return rfNodes;
}

/** Edges reflect the selection chain (a strong stroke over the dimmed rest) and
 *  the hover chain (lighting the hovered node's up/down paths end to end without
 *  dimming anything), plus a direct glow on the selected or hovered edge. */
function buildEdges(
  info: GraphInfo,
  prefs: Prefs,
  selected: string | null,
  hoverNode: string | null,
  selectedEdge: string | null,
  hoverEdge: string | null,
  onAnchorGrab: (id: string, source: string, target: string, end: "source" | "target", x: number, y: number) => void,
  retargetingId: string | null,
): Edge[] {
  const { laid, sectionHue, byId, up, down, incoming } = info;
  // class for an edge: selected (glow marker) and/or retargeting (blinks while
  // one of its ends is being moved).
  const edgeClass = (id: string): string | undefined => {
    const c: string[] = [];
    if (id === selectedEdge) c.push("edge-selected");
    if (id === retargetingId) c.push("edge-retargeting");
    return c.length ? c.join(" ") : undefined;
  };
  const selAnc = selected ? reach(up, selected) : new Set<string>();
  const selDesc = selected ? reach(down, selected) : new Set<string>();
  const hovAnc = hoverNode ? reach(up, hoverNode) : new Set<string>();
  const hovDesc = hoverNode ? reach(down, hoverNode) : new Set<string>();
  const dimmed = (id: string): boolean =>
    !!selected && id !== selected && !selAnc.has(id) && !selDesc.has(id);

  const rfEdges: Edge[] = [];
  for (const e of laid.edges) {
    if (e.kind === "comment") {
      const glow = e.id === selectedEdge || e.id === hoverEdge;
      rfEdges.push({
        id: e.id,
        type: "floating",
        source: e.source,
        target: e.target,
        style: glow
          ? { stroke: "#caa83a", strokeWidth: 1.8, strokeDasharray: "2 3", opacity: 1, filter: glowFilter("#caa83a") }
          : { stroke: "#caa83a", strokeWidth: 1.5, strokeDasharray: "2 3", opacity: 0.6 },
        className: edgeClass(e.id),
        data: { kind: "comment", anchors: e.id === selectedEdge || e.id === hoverEdge, onAnchorGrab },
      });
      continue;
    }
    if (!prefs.showDeps) continue;
    const tgt = byId.get(e.target);
    const src = byId.get(e.source);
    const ghost = src?.status === "missing" || tgt?.status === "missing";
    const hue = tgt?.sectionId ? (sectionHue.get(tgt.sectionId) ?? 210) : 210;
    const baseColor = ghost ? ghostCol() : prefs.edgeColor === "neutral" ? mutedCol() : accent(hue);
    const selHL = edgeDir(e, selected, selAnc, selDesc);
    const hovHL = edgeDir(e, hoverNode, hovAnc, hovDesc);
    // Selection (click) = focus mode: the chain is a solid thicker stroke over
    // the dimmed rest, no glow. Hover (Paths) = preview: the chain is lit with a
    // dispersed glow and nothing is dimmed. Selection wins where both apply.
    let styleBase: { stroke: string; strokeWidth: number; opacity: number; strokeDasharray?: string; filter?: string };
    if (selHL === "up") styleBase = { stroke: upCol(), strokeWidth: 2.6, opacity: 1 };
    else if (selHL === "down") styleBase = { stroke: downCol(), strokeWidth: 2.6, opacity: 1, strokeDasharray: "6 4" };
    else if (hovHL === "up") styleBase = { stroke: upCol(), strokeWidth: 1.8, opacity: 1, filter: glowFilter(upCol()) };
    else if (hovHL === "down") styleBase = { stroke: downCol(), strokeWidth: 1.8, opacity: 1, strokeDasharray: "6 4", filter: glowFilter(downCol()) };
    else
      styleBase = {
        stroke: baseColor,
        strokeWidth: 1.6,
        strokeDasharray: ghost ? "5 4" : undefined,
        opacity: selected ? 0.07 : ghost ? 0.5 : 0.55,
      };
    // A selected or hovered edge itself always glows in its own color.
    const glowEdge = e.id === selectedEdge || e.id === hoverEdge;
    const style = glowEdge
      ? { ...styleBase, strokeWidth: Math.max(styleBase.strokeWidth, 2), opacity: 1, filter: glowFilter(styleBase.stroke) }
      : styleBase;
    rfEdges.push({
      id: e.id,
      type: "floating",
      source: e.source,
      target: e.target,
      style,
      className: edgeClass(e.id),
      data: { originDot: true, kind: "dependency", anchors: glowEdge, onAnchorGrab },
      markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke },
    });
  }

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

  return rfEdges;
}
