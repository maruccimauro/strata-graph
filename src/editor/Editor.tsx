import { useCallback, useEffect, useMemo, useState } from "react";
import { useReactFlow, getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";

import { StrataCanvas } from "./StrataCanvas";
import type { Retarget } from "./StrataCanvas";
import { NodeOverlay } from "./NodeOverlay";
import { ConnectPanel, type Direction } from "./ConnectPanel";
import { TopBar } from "./ui/TopBar";
import { ContextMenu, type ContextMenuItem } from "./ui/ContextMenu";
import { Panel, Button } from "./ui/primitives";
import { PreferencesPanel } from "./ui/PreferencesPanel";
import { buildRenderModel } from "./model";
import { persist, pickFile, openPath, DEFAULT_PREFS, type Boot, type ViewerState, type Prefs } from "./api";
import { t, setLang } from "./i18n";
import type { GraphNode, GraphEdge, GraphModel } from "../core/types";
import { toSgm, fromSgm } from "../core/sgm";
import { isDark, MUTED } from "./theme";

const THEME_KEY = "strata-theme";

/** True when the keyboard event targets a text field, so global shortcuts like
 *  Delete do not fire while the user is typing in an input/textarea/combobox. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable === true;
}

export function Editor({ boot, onLoadModel }: { boot: Boot; onLoadModel?: (model: GraphModel) => void }) {
  const graph = boot.graph;
  const connected = boot.mode === "connected";
  const rf = useReactFlow();

  const [state, setState] = useState<ViewerState>(() => ({
    ...boot.state,
    // merge defaults so prefs added after a state was saved (e.g. hoverHighlight)
    // take their default instead of coming back undefined.
    prefs: { ...DEFAULT_PREFS, ...boot.state.prefs },
  }));
  const [undoStack, setUndoStack] = useState<ViewerState[]>([]);
  const [redoStack, setRedoStack] = useState<ViewerState[]>([]);
  const [themeKey, setThemeKey] = useState(0);
  const [overlay, setOverlay] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const [edgeOverlay, setEdgeOverlay] = useState<{ id: string; source: string; target: string; deletable: boolean; x: number; y: number } | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [pending, setPending] = useState<{ a: string; b: string } | null>(null);
  const [connectFrom, setConnectFrom] = useState<GraphNode | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  // Edge retarget in progress (N-25): one endpoint follows the cursor while the
  // other stays fixed. Keeps the original overlay anchor so Esc can reopen it.
  const [retarget, setRetarget] = useState<
    { edgeId: string; movingEnd: "source" | "target"; fixedNodeId: string; source: string; target: string; x: number; y: number } | null
  >(null);
  // List-driven retarget (N-25b): reuses ConnectPanel locked to one end.
  const [retargetList, setRetargetList] = useState<{ edgeId: string; movingEnd: "source" | "target"; fixedNodeId: string } | null>(null);

  const prefs = state.prefs ?? DEFAULT_PREFS;
  // Select the UI language before rendering any translated string (English only
  // today). Mirrors the theme pattern: a cheap, synchronous read from prefs.
  setLang(prefs.lang);
  const model = useMemo(() => buildRenderModel(graph, state), [graph, state]);
  const labelOf = useCallback((id: string) => model.nodes.find((n) => n.id === id)?.label ?? id, [model]);
  const infoOf = useCallback(
    (id: string) => {
      const n = model.nodes.find((x) => x.id === id);
      const section = n?.sectionId ? model.sections.find((s) => s.id === n.sectionId)?.label : undefined;
      return { label: n?.label ?? id, section };
    },
    [model],
  );

  const save = useCallback((next: ViewerState) => persist(boot.mode, graph.meta.name, next), [boot.mode, graph.meta.name]);

  /** undoable change */
  const commit = useCallback(
    (updater: (s: ViewerState) => ViewerState) => {
      setState((cur) => {
        setUndoStack((u) => [...u.slice(-49), cur]);
        setRedoStack([]);
        const next = updater(cur);
        save(next);
        return next;
      });
    },
    [save],
  );
  /** non-undoable change (positions, prefs) */
  const patch = useCallback(
    (updater: (s: ViewerState) => ViewerState) => {
      setState((cur) => {
        const next = updater(cur);
        save(next);
        return next;
      });
    },
    [save],
  );

  const undo = useCallback(() => {
    setUndoStack((u) => {
      if (!u.length) return u;
      const prev = u[u.length - 1];
      setState((cur) => {
        setRedoStack((r) => [...r, cur]);
        save(prev);
        return prev;
      });
      return u.slice(0, -1);
    });
  }, [save]);
  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (!r.length) return r;
      const next = r[r.length - 1];
      setState((cur) => {
        setUndoStack((u) => [...u, cur]);
        save(next);
        return next;
      });
      return r.slice(0, -1);
    });
  }, [save]);

  // remember which canon docs have ever been generated (connected scans) so a
  // doc that later disappears can be shown as "unavailable" (crossed out).
  useEffect(() => {
    if (!connected) return;
    const genIds = graph.nodes.filter((n) => n.kind === "doc" && n.origin === "auto" && n.status === "generated").map((n) => n.id);
    setState((cur) => {
      const seen = new Set(cur.seenGenerated ?? []);
      let changed = false;
      for (const id of genIds) if (!seen.has(id)) { seen.add(id); changed = true; }
      if (!changed) return cur;
      const next = { ...cur, seenGenerated: [...seen] };
      save(next);
      return next;
    });
  }, [connected, graph, save]);

  // ----- actions -----
  const onPersistPositions = useCallback(
    (pos: Record<string, { x: number; y: number }>) => patch((s) => ({ ...s, pos: { ...(s.pos ?? {}), ...pos } })),
    [patch],
  );

  const addNodeAt = useCallback(
    (node: Omit<GraphNode, "position" | "id">, flowPos?: { x: number; y: number }) => {
      const id = `manual:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;
      const pos = flowPos ?? rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      commit((s) => ({
        ...s,
        manualNodes: [...(s.manualNodes ?? []), { ...node, id, createdAt: node.createdAt ?? Date.now() }],
        pos: { ...(s.pos ?? {}), [id]: pos },
      }));
    },
    [commit, rf],
  );

  const onAddNode = useCallback(async () => {
    if (connected) {
      const r = await pickFile();
      if (r.abspath) {
        addNodeAt({
          label: r.name ?? "Node",
          kind: "doc",
          origin: "manual",
          status: "generated",
          files: [{ path: r.relpath ?? r.name ?? "", abspath: r.abspath }],
        });
        return;
      }
      if (r.cancelled) return;
      // error -> fall through to prompt
    }
    const name = window.prompt(t("prompt.nodeName"));
    if (name) addNodeAt({ label: name, kind: "doc", origin: "manual", status: "generated" });
  }, [connected, addNodeAt]);

  const onDeleteNode = useCallback(
    (id: string) =>
      commit((s) => ({
        ...s,
        manualNodes: (s.manualNodes ?? []).filter((n) => n.id !== id),
        manualEdges: (s.manualEdges ?? []).filter((e) => e.source !== id && e.target !== id),
      })),
    [commit],
  );

  const onSetSection = useCallback(
    (id: string, sectionId: string) => commit((s) => ({ ...s, sectionOverrides: { ...(s.sectionOverrides ?? {}), [id]: sectionId } })),
    [commit],
  );

  const onSetNodeMeta = useCallback(
    (id: string, m: { createdAt?: number; dueAt?: number; locked?: boolean }) =>
      commit((s) => {
        const cur = (s.nodeMeta ?? {})[id] ?? {};
        return { ...s, nodeMeta: { ...(s.nodeMeta ?? {}), [id]: { ...cur, ...m } } };
      }),
    [commit],
  );

  const onSetNodeMetaMany = useCallback(
    (ids: string[], m: { dueAt?: number; locked?: boolean }) =>
      commit((s) => {
        const nm = { ...(s.nodeMeta ?? {}) };
        for (const id of ids) nm[id] = { ...(nm[id] ?? {}), ...m };
        return { ...s, nodeMeta: nm };
      }),
    [commit],
  );

  const onDeleteEdge = useCallback(
    (id: string) => {
      if (id.startsWith("branch:")) return;
      commit((s) =>
        (s.manualEdges ?? []).some((e) => e.id === id)
          ? { ...s, manualEdges: (s.manualEdges ?? []).filter((e) => e.id !== id) }
          : { ...s, removedEdges: [...(s.removedEdges ?? []), id] },
      );
      setEdgeOverlay(null);
      setSelectedEdge((cur) => (cur === id ? null : cur));
    },
    [commit],
  );

  /** Reconnect one end of an edge to a different node (drag a reconnect anchor).
   *  A manual edge is replaced in place; an auto edge is removed and a manual
   *  replacement with the new endpoints is created. Branch edges are not
   *  reconnectable (blocked in the canvas). */
  const onReconnectEdge = useCallback(
    (edgeId: string, source: string, target: string) => {
      if (edgeId.startsWith("branch:") || source === target) return;
      const orig = model.edges.find((e) => e.id === edgeId);
      const kind: GraphEdge["kind"] = orig?.kind ?? "dependency";
      const newId = `manual:${source}->${target}:${kind}`;
      const replacement: GraphEdge = {
        id: newId,
        source,
        target,
        kind,
        origin: "manual",
        ...(kind === "dependency" ? { via: "manual" as const } : {}),
      };
      commit((s) => {
        const manualEdges = s.manualEdges ?? [];
        const isManual = manualEdges.some((e) => e.id === edgeId);
        // drop the old manual edge (if any) and any edge that already matches the
        // new endpoints, then add the replacement.
        const kept = manualEdges.filter((e) => e.id !== edgeId && e.id !== newId);
        const nextManual = [...kept, replacement];
        if (isManual) return { ...s, manualEdges: nextManual };
        const removed = s.removedEdges ?? [];
        return {
          ...s,
          manualEdges: nextManual,
          removedEdges: removed.includes(edgeId) ? removed : [...removed, edgeId],
        };
      });
      setSelectedEdge((cur) => (cur === edgeId ? null : cur));
    },
    [commit, model],
  );

  // ----- edge retarget (N-25) -----
  /** Enter sticky mouse-retarget for one end of a given edge. The opposite end
   *  stays fixed; any open overlay hides while a node is picked. Branch edges
   *  are not retargetable. */
  const beginRetarget = useCallback(
    (edge: { id: string; source: string; target: string; x: number; y: number }, movingEnd: "source" | "target") => {
      if (edge.id.startsWith("branch:")) return;
      const fixedNodeId = movingEnd === "source" ? edge.target : edge.source;
      setOverlay(null);
      setEdgeOverlay(null);
      setSelectedNode(null);
      setSelectedEdge(edge.id);
      setRetarget({ edgeId: edge.id, movingEnd, fixedNodeId, source: edge.source, target: edge.target, x: edge.x, y: edge.y });
    },
    [],
  );
  /** Start retarget from the edge overlay (uses its current anchor position). */
  const startMouseRetarget = useCallback(
    (movingEnd: "source" | "target") => {
      if (!edgeOverlay || !edgeOverlay.deletable) return;
      beginRetarget(edgeOverlay, movingEnd);
    },
    [edgeOverlay, beginRetarget],
  );
  /** Open the list retarget panel (ConnectPanel locked to one end). */
  const startListRetarget = useCallback(
    (edge: { id: string; source: string; target: string }, movingEnd: "source" | "target") => {
      if (edge.id.startsWith("branch:")) return;
      const fixedNodeId = movingEnd === "source" ? edge.target : edge.source;
      setOverlay(null);
      setEdgeOverlay(null);
      setSelectedNode(null);
      setSelectedEdge(edge.id);
      setRetargetList({ edgeId: edge.id, movingEnd, fixedNodeId });
    },
    [],
  );
  /** Commit the list retarget: reconnect the moving end to the picked node. */
  const commitListRetarget = useCallback(
    (nodeId: string) => {
      setRetargetList((r) => {
        if (!r) return null;
        const newSource = r.movingEnd === "source" ? nodeId : r.fixedNodeId;
        const newTarget = r.movingEnd === "target" ? nodeId : r.fixedNodeId;
        if (newSource !== newTarget) onReconnectEdge(r.edgeId, newSource, newTarget);
        return null;
      });
    },
    [onReconnectEdge],
  );
  /** Commit the picked node as the moving end and reconnect the edge. */
  const onRetargetPick = useCallback(
    (nodeId: string) => {
      setRetarget((r) => {
        if (!r) return null;
        const newSource = r.movingEnd === "source" ? nodeId : r.fixedNodeId;
        const newTarget = r.movingEnd === "target" ? nodeId : r.fixedNodeId;
        if (newSource !== newTarget) onReconnectEdge(r.edgeId, newSource, newTarget);
        return null;
      });
    },
    [onReconnectEdge],
  );
  /** Cancel retarget: leave the edge untouched and reopen its overlay. */
  const cancelRetarget = useCallback(() => {
    setRetarget((r) => {
      if (r) setEdgeOverlay({ id: r.edgeId, source: r.source, target: r.target, deletable: !r.edgeId.startsWith("branch:"), x: r.x, y: r.y });
      return null;
    });
  }, []);

  const addEdge = useCallback(
    (edge: Omit<GraphEdge, "id">) => {
      const id = `manual:${edge.source}->${edge.target}:${edge.kind}`;
      commit((s) => {
        if ((s.manualEdges ?? []).some((e) => e.id === id)) return s;
        return { ...s, manualEdges: [...(s.manualEdges ?? []), { ...edge, id }] };
      });
    },
    [commit],
  );

  const onAddComment = useCallback(
    (nodeId: string) => {
      const title = window.prompt(t("prompt.commentTitle"));
      if (!title) return;
      const note = window.prompt(t("prompt.commentDesc")) ?? undefined;
      const anchor = model.nodes.find((n) => n.id === nodeId)?.position ?? { x: 0, y: 0 };
      const id = `manual:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;
      commit((s) => ({
        ...s,
        manualNodes: [...(s.manualNodes ?? []), { id, label: title, note, kind: "comment", origin: "manual", status: "generated", createdAt: Date.now() }],
        manualEdges: [...(s.manualEdges ?? []), { id: `cmt:${id}`, source: id, target: nodeId, kind: "comment", origin: "manual" }],
        pos: { ...(s.pos ?? {}), [id]: { x: anchor.x + 190, y: anchor.y - 50 } },
      }));
      setOverlay(null);
    },
    [commit, model],
  );

  const onResetLayout = useCallback(() => commit((s) => ({ ...s, pos: {} })), [commit]);
  const setPrefs = useCallback((p: Partial<Prefs>) => patch((s) => ({ ...s, prefs: { ...(s.prefs ?? DEFAULT_PREFS), ...p } })), [patch]);
  const setSectionHue = useCallback(
    (id: string, hue: number) => patch((s) => ({ ...s, sectionHues: { ...(s.sectionHues ?? {}), [id]: hue } })),
    [patch],
  );
  const resetSectionHue = useCallback(
    (id: string) =>
      patch((s) => {
        const next = { ...(s.sectionHues ?? {}) };
        delete next[id];
        return { ...s, sectionHues: next };
      }),
    [patch],
  );

  // Re-fit the viewport when the band orientation changes so the relaid-out
  // graph is framed, not left off-screen.
  useEffect(() => {
    const t = setTimeout(() => rf.fitView({ padding: 0.1, duration: 300 }), 60);
    return () => clearTimeout(t);
  }, [prefs.layout, rf]);

  const toggleTheme = useCallback(() => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    setThemeKey((k) => k + 1);
  }, []);

  const onFit = useCallback(() => rf.fitView({ duration: 300 }), [rf]);

  const onExportSgm = useCallback(() => {
    const blob = new Blob([toSgm(model)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${graph.meta.name}.sgm`;
    a.click();
    URL.revokeObjectURL(url);
  }, [model, graph.meta.name]);

  const onImportSgm = useCallback(() => {
    if (!onLoadModel) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".sgm,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          onLoadModel(fromSgm(String(reader.result)));
        } catch (e) {
          window.alert(e instanceof Error ? e.message : "Invalid .sgm file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [onLoadModel]);

  const onExportPng = useCallback(() => {
    const el = document.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!el) return;
    const bounds = getNodesBounds(rf.getNodes());
    const pad = 60;
    const w = Math.min(4096, Math.ceil(bounds.width) + pad * 2);
    const h = Math.min(4096, Math.ceil(bounds.height) + pad * 2);
    const vp = getViewportForBounds(bounds, w, h, 0.2, 2, 0.1);
    const bg = getComputedStyle(document.body).backgroundColor;
    void toPng(el, {
      backgroundColor: bg,
      width: w,
      height: h,
      style: { width: `${w}px`, height: `${h}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
    }).then((dataUrl) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${graph.meta.name}-strata.png`;
      a.click();
    });
  }, [rf, graph.meta.name]);

  const createConnection = useCallback(
    (targetId: string, direction: Direction) => {
      if (!connectFrom) return;
      const a = connectFrom.id;
      const b = targetId;
      if (direction === "comment") addEdge({ source: a, target: b, kind: "comment", origin: "manual" });
      else if (direction === "to-dep-from") addEdge({ source: b, target: a, kind: "dependency", origin: "manual", via: "manual" });
      else addEdge({ source: a, target: b, kind: "dependency", origin: "manual", via: "manual" });
      setConnectFrom(null);
    },
    [connectFrom, addEdge],
  );

  const confirmConnection = useCallback(
    (kind: "a-dep-b" | "b-dep-a" | "comment") => {
      if (!pending) return;
      const { a, b } = pending;
      if (kind === "comment") addEdge({ source: a, target: b, kind: "comment", origin: "manual" });
      else if (kind === "a-dep-b") addEdge({ source: b, target: a, kind: "dependency", origin: "manual", via: "manual" });
      else addEdge({ source: a, target: b, kind: "dependency", origin: "manual", via: "manual" });
      setPending(null);
    },
    [pending, addEdge],
  );

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Escape") {
        // Staged Escape: a retarget in progress is cancelled first (reopening its
        // overlay); then any open overlay or panel closes; then the selection clears.
        if (retarget) {
          cancelRetarget();
        } else if (overlay || edgeOverlay || prefsOpen || pending || connectFrom || retargetList) {
          setOverlay(null);
          setEdgeOverlay(null);
          setPrefsOpen(false);
          setPending(null);
          setConnectFrom(null);
          setRetargetList(null);
        } else {
          setSelectedNode(null);
          setSelectedEdge(null);
        }
      } else if ((e.key === "Delete" || e.key === "Backspace") && isEditableTarget(e.target) === false) {
        // Delete the selected dependency/comment edge (auto branch edges are
        // never selectable, so this cannot remove a section branch).
        setSelectedEdge((cur) => {
          if (cur) {
            e.preventDefault();
            onDeleteEdge(cur);
          }
          return null;
        });
      } else if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== "INPUT") {
        void onAddNode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, onAddNode, onDeleteEdge, overlay, edgeOverlay, prefsOpen, pending, connectFrom, retargetList, retarget, cancelRetarget]);

  // ----- context menus (right-click), per the configurability policy -----
  const paneMenu = (): ContextMenuItem[] => [
    { label: t("ctx.addNode"), onClick: () => void onAddNode() },
    { label: t("menu.view.fit"), onClick: onFit },
    { label: t("menu.view.reset"), onClick: onResetLayout },
    { label: "", onClick: () => {}, separator: true },
    { label: t("menu.view.hoverPaths"), checked: prefs.hoverHighlight, onClick: () => setPrefs({ hoverHighlight: !prefs.hoverHighlight }) },
    { label: t("menu.view.showDeps"), checked: prefs.showDeps, onClick: () => setPrefs({ showDeps: !prefs.showDeps }) },
    { label: t("menu.view.hideMissing"), checked: prefs.hideMissing, onClick: () => setPrefs({ hideMissing: !prefs.hideMissing }) },
    { label: "", onClick: () => {}, separator: true },
    { label: t("menu.view.theme"), onClick: toggleTheme },
    { label: t("menu.edit.prefs"), onClick: () => setPrefsOpen(true) },
  ];
  const nodeMenu = (node: GraphNode, x: number, y: number): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      { label: t("ctx.openDetails"), onClick: () => { setEdgeOverlay(null); setSelectedEdge(null); setSelectedNode(node.id); setOverlay({ node, x, y }); } },
      { label: node.locked ? t("ctx.unlock") : t("ctx.lock"), onClick: () => onSetNodeMeta(node.id, { locked: !node.locked }) },
    ];
    if (node.kind !== "section") {
      items.push(
        { label: t("ctx.connect"), onClick: () => { setOverlay(null); setConnectFrom(node); } },
        { label: t("ctx.addComment"), onClick: () => onAddComment(node.id) },
      );
      if (node.origin === "manual") {
        items.push({ label: "", onClick: () => {}, separator: true }, { label: t("common.delete"), danger: true, onClick: () => onDeleteNode(node.id) });
      }
    }
    return items;
  };
  const edgeMenu = (id: string, source: string, target: string, x: number, y: number): ContextMenuItem[] => {
    const deletable = !id.startsWith("branch:");
    const items: ContextMenuItem[] = [
      { label: t("ctx.openDetails"), onClick: () => { setOverlay(null); setSelectedNode(null); setSelectedEdge(id); setEdgeOverlay({ id, source, target, deletable, x, y }); } },
    ];
    if (deletable) {
      items.push(
        { label: t("ctx.retargetPrereq"), onClick: () => beginRetarget({ id, source, target, x, y }, "source") },
        { label: t("ctx.retargetDependent"), onClick: () => beginRetarget({ id, source, target, x, y }, "target") },
        { label: "", onClick: () => {}, separator: true },
        { label: t("common.delete"), danger: true, onClick: () => onDeleteEdge(id) },
      );
    }
    return items;
  };

  const genDocs = model.nodes.filter((n) => n.kind === "doc" && n.status === "generated").length;
  const totalDocs = model.nodes.filter((n) => n.kind === "doc").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBar
        projectName={graph.meta.name}
        mode={boot.mode}
        genDocs={genDocs}
        totalDocs={totalDocs}
        sections={model.sections.length}
        prefs={prefs}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onAddNode={() => void onAddNode()}
        onExportPng={onExportPng}
        onExportSgm={onExportSgm}
        onImportSgm={onLoadModel ? onImportSgm : undefined}
        onFit={onFit}
        onResetLayout={onResetLayout}
        onToggleTheme={toggleTheme}
        onOpenPrefs={() => setPrefsOpen(true)}
        onUndo={undo}
        onRedo={redo}
        onPrefsChange={setPrefs}
      />
      <div
        style={{ flex: 1, minHeight: 0 }}
        onContextMenu={(e) => e.preventDefault()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) {
            const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
            addNodeAt({ label: f.name, kind: "doc", origin: "manual", status: "generated" }, p);
          }
        }}
      >
        <StrataCanvas
          model={model}
          prefs={prefs}
          themeKey={themeKey}
          onPersistPositions={onPersistPositions}
          onConnectNodes={(source, target) => setPending({ a: source, b: target })}
          onActivateNode={(node, x, y) => {
            setEdgeOverlay(null);
            setOverlay({ node, x, y });
          }}
          onActivateEdge={(id, source, target, x, y) => {
            setOverlay(null);
            setEdgeOverlay({ id, source, target, deletable: !id.startsWith("branch:"), x, y });
          }}
          onPaneClick={() => {
            setOverlay(null);
            setEdgeOverlay(null);
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
          onCloseOverlays={() => {
            setOverlay(null);
            setEdgeOverlay(null);
          }}
          onSelectionChange={setSelectedIds}
          selected={selectedNode}
          onSelectNode={setSelectedNode}
          selectedEdge={selectedEdge}
          onSelectEdge={setSelectedEdge}
          retarget={retarget ? ({ edgeId: retarget.edgeId, movingEnd: retarget.movingEnd, fixedNodeId: retarget.fixedNodeId } as Retarget) : null}
          onRetargetPick={onRetargetPick}
          onRetargetCancel={cancelRetarget}
          onPaneContextMenu={(x, y) => setCtxMenu({ x, y, items: paneMenu() })}
          onNodeContextMenu={(node, x, y) => setCtxMenu({ x, y, items: nodeMenu(node, x, y) })}
          onEdgeContextMenu={(id, source, target, x, y) => setCtxMenu({ x, y, items: edgeMenu(id, source, target, x, y) })}
        />
      </div>

      {overlay && (
        <NodeOverlay
          node={model.nodes.find((n) => n.id === overlay.node.id) ?? overlay.node}
          at={{ x: overlay.x, y: overlay.y }}
          sections={model.sections}
          connected={connected}
          onClose={() => setOverlay(null)}
          onOpen={openPath}
          onSetSection={onSetSection}
          onSetNodeMeta={onSetNodeMeta}
          onAddComment={onAddComment}
          onConnectPanel={(node) => {
            setOverlay(null);
            setConnectFrom(node);
          }}
          onDelete={(id) => {
            onDeleteNode(id);
            setOverlay(null);
          }}
        />
      )}

      {connectFrom && (
        <ConnectPanel
          fromNode={connectFrom}
          nodes={model.nodes}
          sections={model.sections}
          onCreate={createConnection}
          onClose={() => setConnectFrom(null)}
        />
      )}

      {retargetList &&
        (() => {
          const fixed = model.nodes.find((n) => n.id === retargetList.fixedNodeId);
          if (!fixed) return null;
          return (
            <ConnectPanel
              fromNode={fixed}
              nodes={model.nodes}
              sections={model.sections}
              lock={{ fixedLabel: fixed.label }}
              onCreate={(targetId) => commitListRetarget(targetId)}
              onClose={() => setRetargetList(null)}
            />
          );
        })()}

      {edgeOverlay && (
        <Panel
          title={t("edge.title")}
          onClose={() => setEdgeOverlay(null)}
          style={{ left: Math.min(edgeOverlay.x + 12, window.innerWidth - 300), top: Math.min(edgeOverlay.y + 12, window.innerHeight - 200) }}
          actions={
            edgeOverlay.deletable ? (
              <button
                onClick={() => onDeleteEdge(edgeOverlay.id)}
                title={t("edge.deleteTip")}
                style={{ border: "none", background: "transparent", color: "var(--ghost)", cursor: "pointer", fontSize: ".82rem" }}
              >
                🗑
              </button>
            ) : undefined
          }
        >
          {(() => {
            const from = infoOf(edgeOverlay.source);
            const to = infoOf(edgeOverlay.target);
            // New UI strings here are hardcoded for now; migrate through t() in the i18n scaffold (same batch).
            const label = { color: MUTED, fontSize: ".72rem", textTransform: "uppercase" as const, letterSpacing: ".04em" };
            const row = { display: "flex", justifyContent: "space-between" as const, alignItems: "center" as const, gap: 10 };
            const iconBtn = { border: "1px solid var(--line)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: ".95rem", borderRadius: 6, padding: "1px 7px", lineHeight: 1.3 };
            return (
              <div style={{ fontSize: ".82rem", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={row}>
                  <div>
                    <div style={label}>{t("edge.dependsOn")}</div>
                    <b>{from.label}</b>
                    {from.section && <span style={{ color: MUTED }}> · {from.section}</span>}
                  </div>
                  {edgeOverlay.deletable && (
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => startMouseRetarget("source")} title={t("edge.retarget.pointer")} style={iconBtn}>⌖</button>
                      <button onClick={() => startListRetarget(edgeOverlay, "source")} title={t("edge.retarget.list")} style={iconBtn}>☰</button>
                    </div>
                  )}
                </div>
                <div style={{ color: "var(--down)", fontSize: ".9rem" }}>↓</div>
                <div style={row}>
                  <div>
                    <div style={label}>{t("edge.dependent")}</div>
                    <b>{to.label}</b>
                    {to.section && <span style={{ color: MUTED }}> · {to.section}</span>}
                  </div>
                  {edgeOverlay.deletable && (
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => startMouseRetarget("target")} title={t("edge.retarget.pointer")} style={iconBtn}>⌖</button>
                      <button onClick={() => startListRetarget(edgeOverlay, "target")} title={t("edge.retarget.list")} style={iconBtn}>☰</button>
                    </div>
                  )}
                </div>
                {edgeOverlay.deletable ? (
                  <div style={{ color: MUTED, fontSize: ".72rem" }}>{t("edge.retarget.hint")}</div>
                ) : (
                  <div style={{ color: MUTED, fontSize: ".74rem" }}>{t("edge.autoBranch")}</div>
                )}
              </div>
            );
          })()}
        </Panel>
      )}

      {prefsOpen && (
        <PreferencesPanel
          prefs={prefs}
          onChange={setPrefs}
          sections={model.sections}
          customHues={state.sectionHues ?? {}}
          onSectionHue={setSectionHue}
          onResetSectionHue={resetSectionHue}
          onClose={() => setPrefsOpen(false)}
        />
      )}

      {pending && (
        <Panel
          title={t("pending.title")}
          onClose={() => setPending(null)}
          style={{ left: "50%", top: "40%", transform: "translate(-50%, -50%)", minWidth: 280 }}
        >
          <div style={{ fontSize: ".82rem", marginBottom: 10 }}>{t("pending.how")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <Button onClick={() => confirmConnection("a-dep-b")}>
              <b>{labelOf(pending.a)}</b>&nbsp;{t("connect.dependsOnWord")}&nbsp;<b>{labelOf(pending.b)}</b>
            </Button>
            <Button onClick={() => confirmConnection("b-dep-a")}>
              <b>{labelOf(pending.b)}</b>&nbsp;{t("connect.dependsOnWord")}&nbsp;<b>{labelOf(pending.a)}</b>
            </Button>
            <Button variant="ghost" onClick={() => confirmConnection("comment")}>
              {t("connect.comment")}
            </Button>
          </div>
        </Panel>
      )}

      {selectedIds.length >= 2 && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 11px",
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 11,
            boxShadow: "0 12px 34px rgba(0,0,0,.30)",
            zIndex: 60,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: ".8rem", color: MUTED, marginRight: 2 }}>
            <b style={{ color: "var(--ink)" }}>{selectedIds.length}</b> {t("bar.selectedWord")}
          </span>
          <Button title={t("bar.lockAll.tip")} onClick={() => onSetNodeMetaMany(selectedIds, { locked: true })}>
            {t("bar.lockAll")}
          </Button>
          <Button title={t("bar.unlockAll.tip")} onClick={() => onSetNodeMetaMany(selectedIds, { locked: false })}>
            {t("bar.unlockAll")}
          </Button>
        </div>
      )}

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}
    </div>
  );
}
