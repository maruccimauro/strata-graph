import { useCallback, useEffect, useMemo, useState } from "react";
import { useReactFlow, getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";

import { StrataCanvas } from "./StrataCanvas";
import { NodeOverlay } from "./NodeOverlay";
import { ConnectPanel, type Direction } from "./ConnectPanel";
import { TopBar } from "./ui/TopBar";
import { Panel, Button } from "./ui/primitives";
import { PreferencesPanel } from "./ui/PreferencesPanel";
import { buildRenderModel } from "./model";
import { persist, pickFile, openPath, DEFAULT_PREFS, type Boot, type ViewerState, type Prefs } from "./api";
import type { GraphNode, GraphEdge, GraphModel } from "../core/types";
import { toSgm, fromSgm } from "../core/sgm";
import { isDark, MUTED } from "./theme";

const THEME_KEY = "strata-theme";

export function Editor({ boot, onLoadModel }: { boot: Boot; onLoadModel?: (model: GraphModel) => void }) {
  const graph = boot.graph;
  const connected = boot.mode === "connected";
  const rf = useReactFlow();

  const [state, setState] = useState<ViewerState>(() => ({
    ...boot.state,
    prefs: boot.state.prefs ?? DEFAULT_PREFS,
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

  const prefs = state.prefs ?? DEFAULT_PREFS;
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
    const name = window.prompt("Node name:");
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
    },
    [commit],
  );

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
      const title = window.prompt("Comment title:");
      if (!title) return;
      const note = window.prompt("Description (optional):") ?? undefined;
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
        setOverlay(null);
        setEdgeOverlay(null);
        setPrefsOpen(false);
        setPending(null);
        setConnectFrom(null);
      } else if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== "INPUT") {
        void onAddNode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, onAddNode]);

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
          }}
          onCloseOverlays={() => {
            setOverlay(null);
            setEdgeOverlay(null);
          }}
          onSelectionChange={setSelectedIds}
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

      {edgeOverlay && (
        <Panel
          title="Dependency"
          onClose={() => setEdgeOverlay(null)}
          style={{ left: Math.min(edgeOverlay.x + 12, window.innerWidth - 300), top: Math.min(edgeOverlay.y + 12, window.innerHeight - 200) }}
          actions={
            edgeOverlay.deletable ? (
              <button
                onClick={() => onDeleteEdge(edgeOverlay.id)}
                title="Delete this connection"
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
            return (
              <div style={{ fontSize: ".82rem", display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ color: MUTED, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".04em" }}>Depends on</div>
                  <b>{from.label}</b>
                  {from.section && <span style={{ color: MUTED }}> · {from.section}</span>}
                </div>
                <div style={{ color: "var(--down)", fontSize: ".9rem" }}>↓</div>
                <div>
                  <div style={{ color: MUTED, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".04em" }}>Dependent</div>
                  <b>{to.label}</b>
                  {to.section && <span style={{ color: MUTED }}> · {to.section}</span>}
                </div>
                {!edgeOverlay.deletable && (
                  <div style={{ color: MUTED, fontSize: ".74rem" }}>Auto branch from the section node — not deletable.</div>
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
          title="New connection"
          onClose={() => setPending(null)}
          style={{ left: "50%", top: "40%", transform: "translate(-50%, -50%)", minWidth: 280 }}
        >
          <div style={{ fontSize: ".82rem", marginBottom: 10 }}>How are these related?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <Button onClick={() => confirmConnection("a-dep-b")}>
              <b>{labelOf(pending.a)}</b>&nbsp;depends on&nbsp;<b>{labelOf(pending.b)}</b>
            </Button>
            <Button onClick={() => confirmConnection("b-dep-a")}>
              <b>{labelOf(pending.b)}</b>&nbsp;depends on&nbsp;<b>{labelOf(pending.a)}</b>
            </Button>
            <Button variant="ghost" onClick={() => confirmConnection("comment")}>
              Comment link (no dependency)
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
            <b style={{ color: "var(--ink)" }}>{selectedIds.length}</b> selected
          </span>
          <Button title="Lock all selected (prevent moving)" onClick={() => onSetNodeMetaMany(selectedIds, { locked: true })}>
            🔒 Lock all
          </Button>
          <Button title="Unlock all selected" onClick={() => onSetNodeMetaMany(selectedIds, { locked: false })}>
            🔓 Unlock all
          </Button>
        </div>
      )}
    </div>
  );
}
