import { useCallback, useEffect, useMemo, useState } from "react";
import { useReactFlow, getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";

import { StrataCanvas } from "./StrataCanvas";
import type { Retarget } from "./StrataCanvas";
import { NodeOverlay } from "./NodeOverlay";
import { BandPanel } from "./BandPanel";
import { NodeEdgesPanel } from "./NodeEdgesPanel";
import { ConnectPanel, type Direction } from "./ConnectPanel";
import { NewModelPanel } from "./NewModelPanel";
import { DeleteNodeDialog } from "./DeleteNodeDialog";
import { RebuildRelationsPanel } from "./RebuildRelationsPanel";
import { RelationAlertBanner } from "./RelationAlertBanner";
import { TopBar } from "./ui/TopBar";
import { ContextMenu, type ContextMenuItem } from "./ui/ContextMenu";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { ChoiceDialog } from "./ui/ChoiceDialog";
import { Panel, Button } from "./ui/primitives";
import { PreferencesPanel } from "./ui/PreferencesPanel";
import { getBuiltIn, buildDemoModel } from "../models";
import { buildRenderModel } from "./model";
import { deleteBandPatch } from "./bands";
import { reorderSections, moveSection } from "../core/reorder";
import { analyzeBreak, analyzeBreakMany, buildBreakEvent, alertedNodes, dropPair, dropDependent, purgeNode, type BreakAnalysis } from "./integrity";
import { persist, pickFile, openPath, DEFAULT_PREFS, nextLayerOrder, type Boot, type ViewerState, type Prefs, type Startup, type Orientation, type BandBoxMap, type BreakEvent } from "./api";
import { t, setLang } from "./i18n";
import type { GraphNode, GraphEdge, GraphModel, Section } from "../core/types";
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

export function Editor({
  boot,
  onLoadModel,
  firstRun,
  onChooseStartup,
}: {
  boot: Boot;
  onLoadModel?: (model: GraphModel, startup?: Startup) => void;
  firstRun?: boolean;
  onChooseStartup?: (demo: boolean) => void;
}) {
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
  const [bandPanel, setBandPanel] = useState<{ section: Section; central: GraphNode; x: number; y: number } | null>(null);
  // Band deletion (N-34 lote 5): the choice dialog (entry: migrate / delete, then
  // the M3 track / do-not-track stage) and the id of the band whose nodes are being
  // migrated to other bands before the band itself is removed.
  const [bandDelete, setBandDelete] = useState<{ section: Section; nodeIds: string[]; stage: "entry" | "m3" } | null>(null);
  const [migratingBand, setMigratingBand] = useState<string | null>(null);
  const [edgesPanel, setEdgesPanel] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const [edgeOverlay, setEdgeOverlay] = useState<{ id: string; source: string; target: string; deletable: boolean; x: number; y: number } | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [pending, setPending] = useState<{ a: string; b: string } | null>(null);
  const [connectFrom, setConnectFrom] = useState<GraphNode | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Idempotent selection setter: React Flow's SelectionListener fires on every
  // render when its onSelectionChange prop is a fresh function, so always
  // replacing this array would loop. Keep the same reference when the ids match.
  const onSelectionIds = useCallback(
    (ids: string[]) => setSelectedIds((prev) => (prev.length === ids.length && prev.every((v, i) => v === ids[i]) ? prev : ids)),
    [],
  );
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  // Built-in model picker (New from built-in) and the discard confirmation that
  // guards replacing a graph that has unsaved work.
  const [newModelOpen, setNewModelOpen] = useState(false);
  const [pendingLoad, setPendingLoad] = useState<{ model: GraphModel; startup?: Startup } | null>(null);
  // Relational integrity (N-44): the delete confirmation (with bridge preview)
  // and the focused Rebuild relations panel.
  const [deleteDialog, setDeleteDialog] = useState<{ node: GraphNode; analysis: BreakAnalysis } | null>(null);
  const [rebuildOpen, setRebuildOpen] = useState(false);
  // Generic confirmation for alert actions (unlink from the node badge, dismiss
  // an event, reconnect all): a small dialog instead of the native confirm.
  const [confirm, setConfirm] = useState<{ title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void } | null>(null);
  // Node to locate (centered + bounced arrow) from the Rebuild panel; cleared when
  // the panel closes or the node leaves the alert.
  const [locateNode, setLocateNode] = useState<string | null>(null);
  // Rebuild panel focus: the dependent whose section is active (its ghosts flow,
  // the others hide), the reconnection option under the cursor (its ghost lights
  // up), and the deletion events collapsed to their header.
  const [activeDep, setActiveDep] = useState<string | null>(null);
  const [hoverOption, setHoverOption] = useState<{ source: string; target: string } | null>(null);
  const [collapsedEvents, setCollapsedEvents] = useState<string[]>([]);
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
  // Active relational-integrity alerts: the node -> severity map that drives the
  // pulse, and the dotted ghost bridges previewed while the rebuild panel is open.
  const alerts = useMemo(() => state.alerts ?? [], [state.alerts]);
  const alertMap = useMemo(() => alertedNodes(alerts), [alerts]);
  // Ghost reconnection arrows while the panel is open: with a dependent section
  // active, only that dependent's options show (and flow); the one under the
  // cursor lights up. Hidden when ghosts are turned off.
  const ghostBridges = useMemo(() => {
    if (!rebuildOpen || !prefs.alertGhosts) return [];
    const all = alerts.flatMap((ev) => ev.pairs);
    const list = activeDep ? all.filter((p) => p.target === activeDep) : all;
    return list.map((p) => ({
      source: p.source,
      target: p.target,
      state: (hoverOption && hoverOption.source === p.source && hoverOption.target === p.target ? "hot" : activeDep ? "flow" : "idle") as "hot" | "flow" | "idle",
    }));
  }, [rebuildOpen, prefs.alertGhosts, alerts, activeDep, hoverOption]);
  // Clear the located node's arrow once the panel closes or the node is resolved.
  useEffect(() => {
    if (locateNode && (!rebuildOpen || !alertMap.has(locateNode))) setLocateNode(null);
  }, [locateNode, rebuildOpen, alertMap]);
  // Reset the panel focus when it closes or the active dependent is resolved.
  useEffect(() => {
    if (activeDep && (!rebuildOpen || !alertMap.has(activeDep))) setActiveDep(null);
    if (!rebuildOpen) { setHoverOption(null); }
  }, [activeDep, rebuildOpen, alertMap]);
  // Reflect the alert visual preferences as CSS variables / a root class so the
  // wave animation and its on/off state apply live.
  useEffect(() => {
    const root = document.documentElement;
    const dur = prefs.alertWaveSpeed >= 3 ? "1.1s" : prefs.alertWaveSpeed <= 1 ? "2.6s" : "1.8s";
    const spread = prefs.alertWaveIntensity >= 3 ? "14px" : prefs.alertWaveIntensity <= 1 ? "6px" : "9px";
    root.style.setProperty("--wave-dur", dur);
    root.style.setProperty("--wave-spread", spread);
    root.classList.toggle("no-alert-waves", !prefs.alertWaves);
  }, [prefs.alertWaves, prefs.alertWaveIntensity, prefs.alertWaveSpeed]);
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
    (pos: Record<string, { x: number; y: number }>) =>
      patch((s) => {
        const layout = s.prefs?.layout ?? "horizontal";
        return { ...s, pos: { ...(s.pos ?? {}), [layout]: { ...(s.pos?.[layout] ?? {}), ...pos } } };
      }),
    [patch],
  );

  const onPersistBands = useCallback(
    (boxes: BandBoxMap) =>
      patch((s) => {
        const layout = s.prefs?.layout ?? "horizontal";
        return { ...s, bandBoxes: { ...(s.bandBoxes ?? {}), [layout]: boxes } };
      }),
    [patch],
  );

  const addNodeAt = useCallback(
    (node: Omit<GraphNode, "position" | "id">, flowPos?: { x: number; y: number }) => {
      const id = `manual:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;
      const pos = flowPos ?? rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      commit((s) => {
        const layout = s.prefs?.layout ?? "horizontal";
        return {
          ...s,
          manualNodes: [...(s.manualNodes ?? []), { ...node, id, createdAt: node.createdAt ?? Date.now() }],
          pos: { ...(s.pos ?? {}), [layout]: { ...(s.pos?.[layout] ?? {}), [id]: pos } },
        };
      });
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

  // ----- node deletion + relational integrity (N-44) -----
  const bridgeId = (source: string, target: string) => `manual:${source}->${target}:dependency`;
  const addBridge = useCallback(
    (manualEdges: GraphEdge[], source: string, target: string): GraphEdge[] => {
      const id = bridgeId(source, target);
      if (manualEdges.some((e) => e.id === id)) return manualEdges;
      return [...manualEdges, { id, source, target, kind: "dependency", origin: "manual", via: "manual" }];
    },
    [],
  );

  /** Apply a node deletion: drop the node (manual list or the removedNodes set
   *  for auto nodes), drop its manual edges, create the accepted bridges, and
   *  register the break event for the neighbors left unresolved. One commit, so
   *  undo reverts the node, its edges, the bridges and the alert together. */
  const performDelete = useCallback(
    (node: GraphNode, analysis: BreakAnalysis, acceptedKeys: Set<string>) => {
      const bridges = analysis.pairs.filter((p) => acceptedKeys.has(`${p.source}\u0000${p.target}`));
      const event = buildBreakEvent(analysis, node.label, acceptedKeys, Date.now());
      commit((s) => {
        const isManual = (s.manualNodes ?? []).some((n) => n.id === node.id);
        const manualNodes = isManual ? (s.manualNodes ?? []).filter((n) => n.id !== node.id) : s.manualNodes ?? [];
        const removedNodes = isManual ? s.removedNodes ?? [] : [...(s.removedNodes ?? []), node.id];
        // Edges touching the node are dropped at render (its endpoint is gone);
        // still prune its manual edges from state so none dangle in storage.
        let manualEdges = (s.manualEdges ?? []).filter((e) => e.source !== node.id && e.target !== node.id);
        for (const b of bridges) manualEdges = addBridge(manualEdges, b.source, b.target);
        // Purge the removed node from any prior alert that referenced it (it no
        // longer exists, so it must not keep being marked), then add the new event.
        const purged = (s.alerts ?? []).flatMap((ev) => { const r = purgeNode(ev, node.id); return r ? [r] : []; });
        const nextAlerts = event ? [...purged, event] : purged;
        return { ...s, manualNodes, removedNodes, manualEdges, alerts: nextAlerts };
      });
      setSelectedNode((cur) => (cur === node.id ? null : cur));
      setOverlay(null);
      setDeleteDialog(null);
    },
    [commit, addBridge],
  );

  /** Delete a set of nodes at once (the band panel's "delete all"): one commit, a
   *  single merged break event for every dependent left unresolved, so undo
   *  reverts the whole band's deletion together. Missing nodes are excluded by the
   *  caller (they are not real nodes to remove). */
  const performBulkDelete = useCallback(
    (ids: string[], removedLabel: string) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const analysis = analyzeBreakMany(model, ids);
      const event = buildBreakEvent(analysis, removedLabel, new Set(), Date.now());
      commit((s) => {
        const manualIds = new Set((s.manualNodes ?? []).filter((n) => idSet.has(n.id)).map((n) => n.id));
        const manualNodes = (s.manualNodes ?? []).filter((n) => !idSet.has(n.id));
        const autoIds = ids.filter((id) => !manualIds.has(id));
        const removedNodes = [...(s.removedNodes ?? []), ...autoIds];
        const manualEdges = (s.manualEdges ?? []).filter((e) => !idSet.has(e.source) && !idSet.has(e.target));
        const purged = (s.alerts ?? []).flatMap((ev) => {
          let r: BreakEvent | null = ev;
          for (const id of ids) { if (!r) break; r = purgeNode(r, id); }
          return r ? [r] : [];
        });
        const nextAlerts = event ? [...purged, event] : purged;
        return { ...s, manualNodes, removedNodes, manualEdges, alerts: nextAlerts };
      });
      setBandPanel(null);
    },
    [model, commit],
  );

  /** Entry point for deleting a node: analyze the relational impact. When the
   *  node has dependency neighbors, open the confirmation (with bridge preview);
   *  otherwise delete straight away (nothing to rebuild). */
  const onRequestDeleteNode = useCallback(
    (id: string) => {
      const node = model.nodes.find((n) => n.id === id);
      if (!node) return;
      const analysis = analyzeBreak(model, id);
      if (Object.keys(analysis.info).length === 0) {
        performDelete(node, analysis, new Set());
        return;
      }
      setOverlay(null);
      setDeleteDialog({ node, analysis });
    },
    [model, performDelete],
  );

  /** Apply fn to one event and drop it if it resolves to null. */
  const editEvent = useCallback(
    (eventId: string, fn: (ev: BreakEvent) => BreakEvent | null) =>
      commit((s) => ({
        ...s,
        alerts: (s.alerts ?? []).flatMap((ev) => {
          if (ev.id !== eventId) return [ev];
          const r = fn(ev);
          return r ? [r] : [];
        }),
      })),
    [commit],
  );

  // ----- option scope: connect / remove one prerequisite option -----
  const connectOption = useCallback(
    (eventId: string, pair: { source: string; target: string }) =>
      commit((s) => ({
        ...s,
        manualEdges: addBridge(s.manualEdges ?? [], pair.source, pair.target),
        alerts: (s.alerts ?? []).flatMap((ev) => { if (ev.id !== eventId) return [ev]; const r = dropPair(ev, pair); return r ? [r] : []; }),
      })),
    [commit, addBridge],
  );
  const removeOption = useCallback(
    (eventId: string, pair: { source: string; target: string }) => editEvent(eventId, (ev) => dropPair(ev, pair)),
    [editEvent],
  );

  // ----- dependent scope: reconnect to all options / unlink -----
  const reconnectDep = useCallback(
    (eventId: string, depId: string) =>
      commit((s) => {
        const ev = (s.alerts ?? []).find((e) => e.id === eventId);
        if (!ev) return s;
        let manualEdges = s.manualEdges ?? [];
        for (const p of ev.pairs) if (p.target === depId) manualEdges = addBridge(manualEdges, p.source, p.target);
        return { ...s, manualEdges, alerts: (s.alerts ?? []).flatMap((e) => (e.id === eventId ? [dropDependent(e, depId)].filter((x): x is BreakEvent => x !== null) : [e])) };
      }),
    [commit, addBridge],
  );
  const unlinkDep = useCallback((eventId: string, depId: string) => editEvent(eventId, (ev) => dropDependent(ev, depId)), [editEvent]);
  const unlinkNodeEverywhere = useCallback(
    (nodeId: string) =>
      commit((s) => ({ ...s, alerts: (s.alerts ?? []).flatMap((ev) => { if (!ev.info[nodeId]) return [ev]; const r = dropDependent(ev, nodeId); return r ? [r] : []; }) })),
    [commit],
  );

  // ----- event scope: reconnect every dependent / dismiss -----
  const reconnectEvent = useCallback(
    (eventId: string) =>
      commit((s) => {
        const ev = (s.alerts ?? []).find((e) => e.id === eventId);
        if (!ev) return s;
        let manualEdges = s.manualEdges ?? [];
        for (const p of ev.pairs) manualEdges = addBridge(manualEdges, p.source, p.target);
        const targets = new Set(ev.pairs.map((p) => p.target));
        return {
          ...s,
          manualEdges,
          alerts: (s.alerts ?? []).flatMap((e) => { if (e.id !== eventId) return [e]; let r: BreakEvent | null = e; for (const d of targets) { if (!r) break; r = dropDependent(r, d); } return r ? [r] : []; }),
        };
      }),
    [commit, addBridge],
  );
  const dismissEvent = useCallback((eventId: string) => commit((s) => ({ ...s, alerts: (s.alerts ?? []).filter((e) => e.id !== eventId) })), [commit]);

  // ----- global scope: reconnect / dismiss every event -----
  const reconnectAllGlobal = useCallback(
    () =>
      commit((s) => {
        let manualEdges = s.manualEdges ?? [];
        for (const ev of s.alerts ?? []) for (const p of ev.pairs) manualEdges = addBridge(manualEdges, p.source, p.target);
        const alerts = (s.alerts ?? []).flatMap((ev) => {
          const targets = new Set(ev.pairs.map((p) => p.target));
          let r: BreakEvent | null = ev;
          for (const d of targets) { if (!r) break; r = dropDependent(r, d); }
          return r ? [r] : [];
        });
        return { ...s, manualEdges, alerts };
      }),
    [commit, addBridge],
  );
  const dismissAllGlobal = useCallback(() => commit((s) => ({ ...s, alerts: [] })), [commit]);

  /** Hide one event's banner (nodes stay marked). View-only, so not undoable. */
  const hideEvent = useCallback(
    (eventId: string) => patch((s) => ({ ...s, alerts: (s.alerts ?? []).map((e) => (e.id === eventId ? { ...e, hidden: true } : e)) })),
    [patch],
  );

  // Confirmation wrappers for the bulk actions (single options and single
  // dependents act directly; event and global scopes confirm first).
  const requestUnlinkNode = useCallback(
    (nodeId: string) =>
      setConfirm({ title: t("confirm.unlink.title"), message: t("confirm.unlink.body", { name: labelOf(nodeId) }), confirmLabel: t("rebuild.unlinkNode"), onConfirm: () => { unlinkNodeEverywhere(nodeId); setConfirm(null); } }),
    [labelOf, unlinkNodeEverywhere],
  );
  const requestReconnectEvent = useCallback(
    (eventId: string) => {
      const ev = (state.alerts ?? []).find((e) => e.id === eventId);
      setConfirm({ title: t("confirm.reconnectEvent.title"), message: t("confirm.reconnectEvent.body", { name: ev?.removedLabel ?? "" }), confirmLabel: t("rebuild.reconnectEvent"), onConfirm: () => { reconnectEvent(eventId); setConfirm(null); } });
    },
    [state.alerts, reconnectEvent],
  );
  const requestDismissEvent = useCallback(
    (eventId: string) => {
      const ev = (state.alerts ?? []).find((e) => e.id === eventId);
      setConfirm({ title: t("confirm.dismiss.title"), message: t("confirm.dismiss.body", { name: ev?.removedLabel ?? "" }), confirmLabel: t("rebuild.dismissEvent"), danger: true, onConfirm: () => { dismissEvent(eventId); setConfirm(null); } });
    },
    [state.alerts, dismissEvent],
  );
  const requestReconnectAll = useCallback(
    () => setConfirm({ title: t("confirm.reconnectAll.title"), message: t("confirm.reconnectAll.body"), confirmLabel: t("rebuild.reconnectAll"), onConfirm: () => { reconnectAllGlobal(); setConfirm(null); } }),
    [reconnectAllGlobal],
  );
  const requestDismissAll = useCallback(
    () => setConfirm({ title: t("confirm.dismissAll.title"), message: t("confirm.dismissAll.body"), confirmLabel: t("rebuild.dismissAll"), danger: true, onConfirm: () => { dismissAllGlobal(); setConfirm(null); } }),
    [dismissAllGlobal],
  );
  /** Center the canvas on a node and point a bounced arrow at it (from the Rebuild
   *  panel). The arrow clears when the panel closes or the node leaves the alert. */
  const onLocateNode = useCallback(
    (nodeId: string) => {
      const n = rf.getNode(nodeId);
      if (n) {
        const w = n.measured?.width ?? 150;
        const h = n.measured?.height ?? 48;
        rf.setCenter(n.position.x + w / 2, n.position.y + h / 2, { zoom: rf.getZoom(), duration: 400 });
      }
      setLocateNode(nodeId);
    },
    [rf],
  );

  const onSetSection = useCallback(
    (id: string, sectionId: string) =>
      commit((s) => {
        // Moving a node to another band drops its saved position in every
        // orientation so it re-grids into the new band, instead of keeping a
        // band-relative offset (or a legacy absolute one) that belonged elsewhere.
        const pos: Partial<Record<Orientation, Record<string, { x: number; y: number }>>> = { ...(s.pos ?? {}) };
        for (const o of Object.keys(pos) as Orientation[]) {
          const m = pos[o];
          if (m && id in m) {
            const next = { ...m };
            delete next[id];
            pos[o] = next;
          }
        }
        return { ...s, sectionOverrides: { ...(s.sectionOverrides ?? {}), [id]: sectionId }, pos };
      }),
    [commit],
  );

  /** Move several nodes to another band in one commit (the band panel's "move all
   *  to…"), dropping each one's saved position in every orientation so they
   *  re-grid into the target band. Mirrors onSetSection for a set. */
  const onSetSectionMany = useCallback(
    (ids: string[], sectionId: string) =>
      commit((s) => {
        const idSet = new Set(ids);
        const pos: Partial<Record<Orientation, Record<string, { x: number; y: number }>>> = { ...(s.pos ?? {}) };
        for (const o of Object.keys(pos) as Orientation[]) {
          const m = pos[o];
          if (!m) continue;
          const next = { ...m };
          for (const id of ids) delete next[id];
          pos[o] = next;
        }
        const sectionOverrides = { ...(s.sectionOverrides ?? {}) };
        for (const id of idSet) sectionOverrides[id] = sectionId;
        return { ...s, sectionOverrides, pos };
      }),
    [commit],
  );

  /** Confirm before deleting every node of a band (band panel bulk action). */
  const requestBandBulkDelete = useCallback(
    (ids: string[], bandLabel: string) =>
      setConfirm({
        title: t("band.bulk.delete.title"),
        message: t("band.bulk.delete.body", { count: String(ids.length), label: bandLabel }),
        confirmLabel: t("band.bulk.delete.confirm"),
        danger: true,
        onConfirm: () => { performBulkDelete(ids, bandLabel); setConfirm(null); },
      }),
    [performBulkDelete],
  );

  /** Reorder bands: persist a full, contiguous sectionOrder override. One moves a
   *  band one step (context menu / arrows), the other drops it at an index (list
   *  drag). The layout re-packs from the new order. */
  const onMoveSection = useCallback(
    (id: string, dir: -1 | 1) => commit((s) => ({ ...s, sectionOrder: moveSection(model.sections, id, dir) })),
    [commit, model.sections],
  );
  const onReorderSection = useCallback(
    (id: string, targetIndex: number) => commit((s) => ({ ...s, sectionOrder: reorderSections(model.sections, id, targetIndex) })),
    [commit, model.sections],
  );

  // ----- band deletion with migration (N-34 lote 5) -----
  /** Every node (central excluded) currently in a band: the set removed with it. */
  const bandNodeIds = useCallback(
    (sectionId: string) => model.nodes.filter((n) => n.kind === "doc" && n.sectionId === sectionId).map((n) => n.id),
    [model.nodes],
  );

  /** Remove a band and the given nodes in a single commit (undo reverts it whole).
   *  When `track` is set, the broken links are recorded as one merged alert so they
   *  can be rebuilt (M3); otherwise the band and its nodes are deleted silently. */
  const performBandDelete = useCallback(
    (section: Section, nodeIds: string[], track: boolean) => {
      const event = track && nodeIds.length > 0 ? buildBreakEvent(analyzeBreakMany(model, nodeIds), section.label, new Set(), Date.now()) : null;
      commit((s) => deleteBandPatch(s, { sectionId: section.id, nodeIds, event }));
      setBandDelete(null);
      setMigratingBand(null);
      setBandPanel(null);
      setOverlay(null);
      setSelectedNode((cur) => (cur && nodeIds.includes(cur) ? null : cur));
    },
    [model, commit],
  );

  /** Entry point for deleting a band (central context menu / band panel). An empty
   *  band is removed after a plain confirmation; a band with nodes opens the choice
   *  dialog (migrate first, or delete the band together with its nodes). */
  const onRequestDeleteBand = useCallback(
    (section: Section) => {
      const ids = bandNodeIds(section.id);
      if (ids.length === 0) {
        setConfirm({
          title: t("band.delete.title", { label: section.label }),
          message: t("band.delete.empty.body", { label: section.label }),
          confirmLabel: t("band.delete.confirm"),
          danger: true,
          onConfirm: () => { performBandDelete(section, [], false); setConfirm(null); },
        });
        return;
      }
      setBandDelete({ section, nodeIds: ids, stage: "entry" });
    },
    [bandNodeIds, performBandDelete],
  );

  /** Finish a migration: delete the band together with whatever nodes were not
   *  moved out. No remaining nodes means the band is now empty, so it is removed
   *  straight away; otherwise the M3 track / do-not-track stage decides. */
  const onFinishMigration = useCallback(
    (section: Section) => {
      const ids = bandNodeIds(section.id);
      if (ids.length === 0) { performBandDelete(section, [], false); return; }
      setBandDelete({ section, nodeIds: ids, stage: "m3" });
    },
    [bandNodeIds, performBandDelete],
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

  /** Bulk-remove dependency edges touching a node (N-41): every edge it depends
   *  on ("up"), every edge that depends on it ("down"), or both, in a single
   *  undoable step. Comment edges and the synthetic branch edge are left alone. */
  const onRemoveEdgesByType = useCallback(
    (nodeId: string, dir: "up" | "down" | "both") => {
      const match = (e: GraphEdge) =>
        e.kind === "dependency" &&
        ((dir !== "down" && e.target === nodeId) || (dir !== "up" && e.source === nodeId));
      const ids = new Set(model.edges.filter(match).map((e) => e.id));
      if (ids.size === 0) return;
      commit((s) => {
        const prevManual = s.manualEdges ?? [];
        const manualIds = new Set(prevManual.map((e) => e.id));
        const removed = [...(s.removedEdges ?? [])];
        for (const id of ids) if (!manualIds.has(id) && !removed.includes(id)) removed.push(id);
        return { ...s, manualEdges: prevManual.filter((e) => !ids.has(e.id)), removedEdges: removed };
      });
      setEdgeOverlay((cur) => (cur && ids.has(cur.id) ? null : cur));
      setSelectedEdge((cur) => (cur && ids.has(cur) ? null : cur));
    },
    [commit, model],
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
  /** Start retarget by clicking an edge endpoint anchor on the canvas. */
  const onAnchorRetarget = useCallback(
    (id: string, source: string, target: string, end: "source" | "target", x: number, y: number) =>
      beginRetarget({ id, source, target, x, y }, end),
    [beginRetarget],
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
      commit((s) => {
        const layout = s.prefs?.layout ?? "horizontal";
        return {
          ...s,
          manualNodes: [...(s.manualNodes ?? []), { id, label: title, note, kind: "comment", origin: "manual", status: "generated", createdAt: Date.now() }],
          manualEdges: [...(s.manualEdges ?? []), { id: `cmt:${id}`, source: id, target: nodeId, kind: "comment", origin: "manual" }],
          pos: { ...(s.pos ?? {}), [layout]: { ...(s.pos?.[layout] ?? {}), [id]: { x: anchor.x + 190, y: anchor.y - 50 } } },
        };
      });
      setOverlay(null);
    },
    [commit, model],
  );

  const onResetLayout = useCallback(
    () =>
      commit((s) => {
        const layout = s.prefs?.layout ?? "horizontal";
        return { ...s, pos: { ...(s.pos ?? {}), [layout]: {} } };
      }),
    [commit],
  );
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
  const setSectionLabel = useCallback(
    (id: string, label: string) => patch((s) => ({ ...s, sectionLabels: { ...(s.sectionLabels ?? {}), [id]: label } })),
    [patch],
  );
  const resetSectionLabel = useCallback(
    (id: string) =>
      patch((s) => {
        const next = { ...(s.sectionLabels ?? {}) };
        delete next[id];
        return { ...s, sectionLabels: next };
      }),
    [patch],
  );
  const setBandGrow = useCallback(
    (id: string, on: boolean) => patch((s) => ({ ...s, bandGrow: { ...(s.bandGrow ?? {}), [id]: on } })),
    [patch],
  );
  const resetBandGrow = useCallback(
    (id: string) =>
      patch((s) => {
        const next = { ...(s.bandGrow ?? {}) };
        delete next[id];
        return { ...s, bandGrow: next };
      }),
    [patch],
  );
  // Re-arrange a single band: drop its documents' saved positions and its captured
  // box for the active orientation, so it re-packs to the content grid (and, if it
  // is grow-off, re-freezes at that tidied size on the next capture).
  const resetBandLayout = useCallback(
    (id: string) => {
      const docIds = new Set(model.nodes.filter((n) => n.kind === "doc" && n.sectionId === id).map((n) => n.id));
      patch((s) => {
        const layout = s.prefs?.layout ?? "horizontal";
        const posL = { ...(s.pos?.[layout] ?? {}) };
        for (const did of docIds) delete posL[did];
        const boxes = { ...(s.bandBoxes?.[layout] ?? {}) };
        delete boxes[id];
        return { ...s, pos: { ...(s.pos ?? {}), [layout]: posL }, bandBoxes: { ...(s.bandBoxes ?? {}), [layout]: boxes } };
      });
    },
    [patch, model],
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

  /** True when the current graph holds unsaved user work (manual nodes/edges,
   *  moved positions, overrides), so replacing it would lose something. */
  const hasWork = useCallback((s: ViewerState): boolean => {
    return Boolean(
      s.manualNodes?.length ||
        s.manualEdges?.length ||
        s.removedEdges?.length ||
        s.removedNodes?.length ||
        s.alerts?.length ||
        (s.pos && Object.values(s.pos).some((m) => m && Object.keys(m).length)) ||
        (s.sectionOverrides && Object.keys(s.sectionOverrides).length) ||
        (s.sectionHues && Object.keys(s.sectionHues).length) ||
        (s.nodeMeta && Object.keys(s.nodeMeta).length),
    );
  }, []);

  /** Load a model as the current graph, confirming first if there is work to lose. */
  const requestLoad = useCallback(
    (next: GraphModel, startup?: Startup) => {
      if (!onLoadModel) return;
      setNewModelOpen(false);
      if (hasWork(state)) setPendingLoad({ model: next, startup });
      else onLoadModel(next, startup);
    },
    [onLoadModel, hasWork, state],
  );

  const pickBuiltIn = useCallback(
    (builtInId: string) => {
      const bi = getBuiltIn(builtInId);
      if (bi) requestLoad(bi.build(), { base: builtInId, demo: false });
    },
    [requestLoad],
  );

  const loadDemo = useCallback(() => requestLoad(buildDemoModel(), { base: "sdlc", demo: true }), [requestLoad]);

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
        // Staged Escape: a confirmation closes first, then a retarget cancels, then
        // any open overlay or panel closes, then the selection clears.
        if (confirm) {
          setConfirm(null);
        } else if (retarget) {
          cancelRetarget();
        } else if (overlay || edgeOverlay || prefsOpen || pending || connectFrom || retargetList || edgesPanel || deleteDialog || rebuildOpen) {
          setOverlay(null);
          setEdgeOverlay(null);
          setPrefsOpen(false);
          setPending(null);
          setConnectFrom(null);
          setRetargetList(null);
          setEdgesPanel(null);
          setDeleteDialog(null);
          setRebuildOpen(false);
        } else {
          setSelectedNode(null);
          setSelectedEdge(null);
        }
      } else if ((e.key === "Delete" || e.key === "Backspace") && isEditableTarget(e.target) === false && !deleteDialog && !confirm) {
        // Delete the selected edge; otherwise the selected node (which opens the
        // delete confirmation when it breaks links). Auto branch edges are never
        // selectable, so this cannot remove a section branch.
        if (selectedEdge) {
          e.preventDefault();
          onDeleteEdge(selectedEdge);
          setSelectedEdge(null);
        } else if (selectedNode) {
          e.preventDefault();
          onRequestDeleteNode(selectedNode);
        }
      } else if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== "INPUT") {
        void onAddNode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, onAddNode, onDeleteEdge, onRequestDeleteNode, overlay, edgeOverlay, prefsOpen, pending, connectFrom, retargetList, edgesPanel, retarget, cancelRetarget, deleteDialog, rebuildOpen, confirm, selectedEdge, selectedNode]);

  // ----- context menus (right-click), per the configurability policy -----
  const paneMenu = (): ContextMenuItem[] => [
    { label: t("ctx.addNode"), onClick: () => void onAddNode() },
    ...(!connected && onLoadModel ? [{ label: t("ctx.newModel"), onClick: () => setNewModelOpen(true) }] : []),
    { label: t("menu.view.fit"), onClick: onFit },
    { label: t("menu.view.reset"), onClick: onResetLayout },
    { label: t("menu.view.layout", { value: t(prefs.layout === "vertical" ? "layout.vertical" : "layout.horizontal") }), onClick: () => setPrefs({ layout: prefs.layout === "vertical" ? "horizontal" : "vertical" }) },
    { label: "", onClick: () => {}, separator: true },
    { label: t("menu.view.hoverPaths"), checked: prefs.hoverHighlight, onClick: () => setPrefs({ hoverHighlight: !prefs.hoverHighlight }) },
    { label: t("menu.view.autoGrow"), checked: prefs.autoGrowBands, onClick: () => setPrefs({ autoGrowBands: !prefs.autoGrowBands }) },
    { label: t("menu.view.showDeps"), checked: prefs.showDeps, onClick: () => setPrefs({ showDeps: !prefs.showDeps }) },
    { label: t("menu.view.dimMissing"), checked: prefs.dimMissing, onClick: () => setPrefs({ dimMissing: !prefs.dimMissing }) },
    { label: t("menu.view.layers", { value: t(`layer.${prefs.layerOrder}`) }), onClick: () => setPrefs({ layerOrder: nextLayerOrder(prefs.layerOrder) }) },
    ...(alerts.length
      ? [
          { label: "", onClick: () => {}, separator: true },
          { label: t("ctx.rebuild"), onClick: () => setRebuildOpen(true) },
          { label: t("ctx.hideAlerts"), onClick: () => alerts.forEach((ev) => hideEvent(ev.id)) },
        ]
      : []),
    { label: "", onClick: () => {}, separator: true },
    { label: t("menu.view.theme"), onClick: toggleTheme },
    { label: t("menu.edit.prefs"), onClick: () => setPrefsOpen(true) },
  ];
  const nodeMenu = (node: GraphNode, x: number, y: number): ContextMenuItem[] => {
    // The central is the band's representative: its context menu opens the band panel.
    if (node.kind === "section") {
      const section = model.sections.find((s) => s.id === node.sectionId);
      if (!section) return [];
      const ordered = [...model.sections].sort((a, b) => a.order - b.order);
      const idx = ordered.findIndex((s) => s.id === section.id);
      const isV = (prefs.layout ?? "horizontal") === "vertical";
      return [
        { label: t("band.panel.open"), onClick: () => { setOverlay(null); setEdgeOverlay(null); setBandPanel({ section, central: node, x, y }); } },
        { label: "", onClick: () => {}, separator: true },
        { label: isV ? t("band.moveLeft") : t("band.moveUp"), disabled: idx <= 0, onClick: () => onMoveSection(section.id, -1) },
        { label: isV ? t("band.moveRight") : t("band.moveDown"), disabled: idx >= ordered.length - 1, onClick: () => onMoveSection(section.id, 1) },
        { label: "", onClick: () => {}, separator: true },
        { label: t("band.delete"), danger: true, onClick: () => onRequestDeleteBand(section) },
      ];
    }
    const items: ContextMenuItem[] = [
      { label: t("ctx.openDetails"), onClick: () => { setEdgeOverlay(null); setSelectedEdge(null); setSelectedNode(node.id); setOverlay({ node, x, y }); } },
      { label: node.locked ? t("ctx.unlock") : t("ctx.lock"), onClick: () => onSetNodeMeta(node.id, { locked: !node.locked }) },
      { label: t("ctx.connect"), onClick: () => { setOverlay(null); setConnectFrom(node); } },
      { label: t("ctx.manageEdges"), onClick: () => { setOverlay(null); setEdgesPanel({ node, x, y }); } },
      { label: t("ctx.addComment"), onClick: () => onAddComment(node.id) },
    ];
    // bulk edge removal by direction (N-41); only the directions with edges show.
    const deps = model.edges.filter((e) => e.kind === "dependency");
    const up = deps.filter((e) => e.target === node.id).length;
    const down = deps.filter((e) => e.source === node.id).length;
    if (up > 0 || down > 0) {
      items.push({ label: "", onClick: () => {}, separator: true });
      if (up > 0) items.push({ label: t("ctx.removeUp", { count: up }), onClick: () => onRemoveEdgesByType(node.id, "up") });
      if (down > 0) items.push({ label: t("ctx.removeDown", { count: down }), onClick: () => onRemoveEdgesByType(node.id, "down") });
      if (up > 0 && down > 0) items.push({ label: t("ctx.removeAllDeps", { count: up + down }), onClick: () => onRemoveEdgesByType(node.id, "both") });
    }
    if (alertMap.has(node.id)) {
      items.push(
        { label: "", onClick: () => {}, separator: true },
        { label: t("ctx.rebuild"), onClick: () => setRebuildOpen(true) },
        { label: t("ctx.unlinkAlert"), onClick: () => unlinkNodeEverywhere(node.id) },
      );
    }
    items.push({ label: "", onClick: () => {}, separator: true }, { label: t("common.delete"), danger: true, onClick: () => onRequestDeleteNode(node.id) });
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
        onNewFromBuiltIn={() => setNewModelOpen(true)}
        onLoadDemo={loadDemo}
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
        alertCount={alertMap.size}
        onOpenRebuild={() => setRebuildOpen(true)}
      />
      <div
        style={{ flex: 1, minHeight: 0, position: "relative" }}
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
          frozenBands={state.bandBoxes?.[prefs.layout ?? "horizontal"]}
          bandGrow={state.bandGrow}
          onPersistBands={onPersistBands}
          onPersistPositions={onPersistPositions}
          onConnectNodes={(source, target) => setPending({ a: source, b: target })}
          onActivateNode={(node, x, y) => {
            setEdgeOverlay(null);
            setOverlay({ node, x, y });
          }}
          onActivateBand={(node, x, y) => {
            const section = model.sections.find((s) => s.id === node.sectionId);
            if (!section) return;
            setOverlay(null);
            setEdgeOverlay(null);
            setBandPanel({ section, central: node, x, y });
          }}
          onReorderSection={onReorderSection}
          onActivateEdge={(id, source, target, x, y) => {
            setOverlay(null);
            setEdgeOverlay({ id, source, target, deletable: !id.startsWith("branch:"), x, y });
          }}
          onPaneClick={() => {
            setOverlay(null);
            setEdgeOverlay(null);
            setBandPanel(null);
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
          onCloseOverlays={() => {
            setOverlay(null);
            setEdgeOverlay(null);
            setBandPanel(null);
          }}
          onSelectionChange={onSelectionIds}
          selected={selectedNode}
          onSelectNode={setSelectedNode}
          selectedEdge={selectedEdge}
          onSelectEdge={setSelectedEdge}
          alerts={alertMap}
          ghostBridges={ghostBridges}
          onAlertBadge={requestUnlinkNode}
          locate={locateNode}
          retarget={retarget ? ({ edgeId: retarget.edgeId, movingEnd: retarget.movingEnd, fixedNodeId: retarget.fixedNodeId } as Retarget) : null}
          onRetargetPick={onRetargetPick}
          onRetargetCancel={cancelRetarget}
          onAnchorRetarget={onAnchorRetarget}
          onPaneContextMenu={(x, y) => setCtxMenu({ x, y, items: paneMenu() })}
          onNodeContextMenu={(node, x, y) => setCtxMenu({ x, y, items: nodeMenu(node, x, y) })}
          onEdgeContextMenu={(id, source, target, x, y) => setCtxMenu({ x, y, items: edgeMenu(id, source, target, x, y) })}
        />
        <RelationAlertBanner events={alerts} onRebuild={() => setRebuildOpen(true)} onHide={hideEvent} />
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
          onManageEdges={(node) => {
            setEdgesPanel({ node, x: overlay.x, y: overlay.y });
            setOverlay(null);
          }}
          onDelete={onRequestDeleteNode}
          alerted={alertMap.has(overlay.node.id)}
          onUnlinkAlert={unlinkNodeEverywhere}
        />
      )}

      {bandPanel && (
        <BandPanel
          section={model.sections.find((s) => s.id === bandPanel.section.id) ?? bandPanel.section}
          central={model.nodes.find((n) => n.id === bandPanel.central.id) ?? bandPanel.central}
          at={{ x: bandPanel.x, y: bandPanel.y }}
          customHue={(state.sectionHues ?? {})[bandPanel.section.id] !== undefined}
          customLabel={(state.sectionLabels ?? {})[bandPanel.section.id] !== undefined}
          grow={(state.bandGrow ?? {})[bandPanel.section.id] ?? prefs.autoGrowBands}
          growOverridden={(state.bandGrow ?? {})[bandPanel.section.id] !== undefined}
          nodes={model.nodes.filter((n) => n.kind === "doc" && n.sectionId === bandPanel.section.id)}
          sections={model.sections}
          vertical={(prefs.layout ?? "horizontal") === "vertical"}
          migrating={migratingBand === bandPanel.section.id}
          onMoveSection={onMoveSection}
          onReorderSection={onReorderSection}
          onClose={() => { setBandPanel(null); setMigratingBand(null); }}
          onSetNodeMeta={onSetNodeMeta}
          onSetNodeMetaMany={onSetNodeMetaMany}
          onSetSection={onSetSection}
          onSetSectionMany={onSetSectionMany}
          onRequestDeleteNode={onRequestDeleteNode}
          onRequestBulkDelete={requestBandBulkDelete}
          onRequestDeleteBand={onRequestDeleteBand}
          onFinishMigration={onFinishMigration}
          onCancelMigration={() => setMigratingBand(null)}
          onOpenNode={(node) => { setBandPanel(null); setOverlay({ node, x: bandPanel.x, y: bandPanel.y }); }}
          onSetSectionHue={setSectionHue}
          onResetSectionHue={resetSectionHue}
          onSetSectionLabel={setSectionLabel}
          onResetSectionLabel={resetSectionLabel}
          onSetBandGrow={setBandGrow}
          onResetBandGrow={resetBandGrow}
          onResetBandLayout={resetBandLayout}
        />
      )}

      {edgesPanel && (
        <NodeEdgesPanel
          node={model.nodes.find((n) => n.id === edgesPanel.node.id) ?? edgesPanel.node}
          edges={model.edges}
          at={{ x: edgesPanel.x, y: edgesPanel.y }}
          infoOf={infoOf}
          onDelete={onDeleteEdge}
          onRemoveByType={(dir) => onRemoveEdgesByType(edgesPanel.node.id, dir)}
          onClose={() => setEdgesPanel(null)}
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

      {newModelOpen && <NewModelPanel onPick={pickBuiltIn} onClose={() => setNewModelOpen(false)} />}

      {pendingLoad && (
        <ConfirmDialog
          title={t("newModel.replaceTitle")}
          message={t("newModel.replaceBody")}
          confirmLabel={t("newModel.replace")}
          danger
          onConfirm={() => { onLoadModel?.(pendingLoad.model, pendingLoad.startup); setPendingLoad(null); }}
          onCancel={() => setPendingLoad(null)}
        />
      )}

      {firstRun && onChooseStartup && (
        <ConfirmDialog
          title={t("welcome.title")}
          message={t("welcome.body")}
          confirmLabel={t("welcome.loadDemo")}
          cancelLabel={t("welcome.startEmpty")}
          onConfirm={() => onChooseStartup(true)}
          onCancel={() => onChooseStartup(false)}
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

      {deleteDialog && (
        <DeleteNodeDialog
          node={deleteDialog.node}
          analysis={deleteDialog.analysis}
          labelOf={labelOf}
          onConfirm={(accepted) => performDelete(deleteDialog.node, deleteDialog.analysis, accepted)}
          onCancel={() => setDeleteDialog(null)}
        />
      )}

      {rebuildOpen && (
        <RebuildRelationsPanel
          alerts={alerts}
          labelOf={labelOf}
          prefs={prefs}
          onSetPrefs={setPrefs}
          onConnectOption={connectOption}
          onRemoveOption={removeOption}
          onReconnectDep={reconnectDep}
          onUnlinkDep={unlinkDep}
          onReconnectEvent={requestReconnectEvent}
          onDismissEvent={requestDismissEvent}
          onReconnectAll={requestReconnectAll}
          onDismissAll={requestDismissAll}
          activeDep={activeDep}
          onActivateDep={setActiveDep}
          onHoverOption={setHoverOption}
          collapsed={collapsedEvents}
          onToggleCollapse={(id) => setCollapsedEvents((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))}
          onLocate={onLocateNode}
          onClose={() => setRebuildOpen(false)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {bandDelete && bandDelete.stage === "entry" && (
        <ChoiceDialog
          title={t("band.delete.title", { label: bandDelete.section.label })}
          message={t("band.delete.entry.body", { count: String(bandDelete.nodeIds.length), label: bandDelete.section.label })}
          actions={[
            { label: t("band.delete.migrate"), variant: "primary", onClick: () => { setMigratingBand(bandDelete.section.id); setBandDelete(null); } },
            { label: t("band.delete.withNodes"), variant: "danger", onClick: () => setBandDelete({ ...bandDelete, stage: "m3" }) },
          ]}
          onCancel={() => setBandDelete(null)}
        />
      )}

      {bandDelete && bandDelete.stage === "m3" && (
        <ChoiceDialog
          title={t("band.delete.m3.title", { count: String(bandDelete.nodeIds.length) })}
          message={t("band.delete.m3.body")}
          actions={[
            { label: t("band.delete.track"), variant: "primary", onClick: () => performBandDelete(bandDelete.section, bandDelete.nodeIds, true) },
            { label: t("band.delete.noTrack"), variant: "danger", onClick: () => performBandDelete(bandDelete.section, bandDelete.nodeIds, false) },
          ]}
          onCancel={() => setBandDelete(null)}
        />
      )}

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}
    </div>
  );
}
