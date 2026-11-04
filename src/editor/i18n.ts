/** Lightweight i18n layer. English is the only language today; the goal is to
 *  add more without refactoring, so every UI string goes through `t(key)` and
 *  the dictionary below. `prefs.lang` selects the active language; `setLang` is
 *  called once per render from the editor, mirroring the theme pattern.
 *
 *  Keep it deliberately small (no library): a flat key -> string map per
 *  language, `t(key, vars)` with `{name}` interpolation, and a fallback chain
 *  active -> English -> the key itself (so a missing key is visible, not blank). */

export type Lang = "en";

/** Languages offered in Preferences. Only English for now; add entries here. */
export const LANGUAGES: { value: Lang; label: string }[] = [{ value: "en", label: "English" }];

type Dict = Record<string, string>;

const en: Dict = {
  // menu bar
  "menu.file": "File",
  "menu.edit": "Edit",
  "menu.view": "View",
  "menu.file.add": "Add node…",
  "menu.file.new": "New from built-in…",
  "menu.file.demo": "Load demo",
  "menu.file.import": "Import model (.sgm)…",
  "menu.file.export": "Export model (.sgm)…",
  "menu.file.png": "Export PNG…",
  "menu.edit.undo": "Undo",
  "menu.edit.redo": "Redo",
  "menu.edit.prefs": "Preferences…",
  "menu.view.fit": "Fit to screen",
  "menu.view.reset": "Reset layout",
  "menu.view.layout": "Layout: {value}",
  "layout.horizontal": "horizontal",
  "layout.vertical": "vertical",
  "menu.view.hideMissing": "Hide not-generated",
  "menu.view.colorBySection": "Color edges by section",
  "menu.view.showDeps": "Show dependency edges",
  "menu.view.hoverPaths": "Highlight paths on hover",
  "menu.view.theme": "Toggle theme",
  // mode badge + summary
  "badge.connected": "● Connected",
  "badge.static": "○ Static",
  "badge.connected.tip": "Local server: real scan, paths, open file/folder.",
  "badge.static.tip": "Static: demo graph, localStorage.",
  "badge.summary": "{project} · {gen}/{total} docs · {sections} sections",
  // quick bar
  "action.node": "Node",
  "quickbar.paths": "Paths",
  "quickbar.fit": "Fit",
  "quickbar.reset": "Reset",
  "quickbar.hideMissing": "Hide ∅",
  "tip.undo": "Undo (Ctrl+Z)",
  "tip.redo": "Redo (Ctrl+Y)",
  "tip.png": "Export the diagram as PNG",
  "tip.fit": "Fit to screen",
  "tip.reset": "Reset node positions",
  "tip.paths": "Highlight a node's upstream/downstream paths on hover",
  "tip.hideMissing": "Hide not-generated nodes",
  "tip.prefs": "Preferences",
  "tip.theme": "Toggle light/dark",
  // context menus
  "ctx.openDetails": "Open details",
  "ctx.lock": "Lock",
  "ctx.unlock": "Unlock",
  "ctx.connect": "Connect…",
  "ctx.addComment": "Add comment",
  "ctx.addNode": "Add node",
  "ctx.retargetPrereq": "Retarget prerequisite end…",
  "ctx.retargetDependent": "Retarget dependent end…",
  // edge overlay
  "edge.title": "Dependency",
  "edge.dependsOn": "Depends on",
  "edge.dependent": "Dependent",
  "edge.autoBranch": "Auto branch from the section node, not deletable.",
  "edge.deleteTip": "Delete this connection",
  "edge.retarget.pointer": "Retarget by pointer: click a node to set the new end (Esc cancels)",
  "edge.retarget.list": "Retarget from a list",
  "edge.retarget.hint": "⌖ pick a node on the canvas · ☰ choose from a list.",
  // connect / retarget panel
  "connect.title": "Connect node",
  "connect.retargetTitle": "Retarget end",
  "connect.from": "From {name}",
  "connect.keepFixed": "Keep {name} fixed, move the other end",
  "connect.section": "Section",
  "connect.allSections": "All sections",
  "connect.target": "Target node",
  "connect.newNode": "New node",
  "connect.pickNode": "Pick a node…",
  "connect.direction": "Direction",
  "connect.dependsOnWord": "depends on",
  "connect.comment": "Comment link (no dependency)",
  "connect.create": "Create",
  "connect.retarget": "Retarget",
  // new-connection prompt (drag connect)
  "pending.title": "New connection",
  "pending.how": "How are these related?",
  // multi-selection bar
  "bar.selectedWord": "selected",
  "bar.lockAll": "🔒 Lock all",
  "bar.unlockAll": "🔓 Unlock all",
  "bar.lockAll.tip": "Lock all selected (prevent moving)",
  "bar.unlockAll.tip": "Unlock all selected",
  // native prompts
  "prompt.nodeName": "Node name:",
  "prompt.commentTitle": "Comment title:",
  "prompt.commentDesc": "Description (optional):",
  // node overlay
  "overlay.lock.tip": "Lock node (prevent moving)",
  "overlay.unlock.tip": "Unlock node (allow moving)",
  "overlay.connect.tip": "Connect to another node",
  "overlay.comment.tip": "Add a comment",
  "overlay.delete.tip": "Delete node",
  "flag.comment": "🏷️ Comment",
  "flag.manual": "✎ Manual",
  "flag.auto": "⚙ Automatic",
  "flag.notGenerated": "Not generated",
  "flag.generated": "Generated",
  "flag.locked": "🔒 Locked",
  "file.open": "Open file",
  "folder.open": "Open folder",
  "file.none": "No file associated.",
  "overlay.section": "Section",
  "overlay.sectionNone": "— none —",
  "overlay.sectionPh": "Section…",
  "overlay.dueDate": "Due date",
  "overlay.clearDue": "Clear due date",
  "overlay.created": "Created {date}",
  "countdown.overdue": "overdue",
  "countdown.left": "left",
  // preferences
  "prefs.title": "Preferences",
  "prefs.close": "Close (Esc)",
  "prefs.cat.general": "General",
  "prefs.cat.interface": "Interface",
  "prefs.cat.sections": "Sections",
  "prefs.layout.title": "Canvas layout",
  "prefs.layout.horizontal": "Horizontal",
  "prefs.layout.vertical": "Vertical",
  "prefs.layout.help": "Horizontal stacks sections as rows; vertical stacks them as columns.",
  "prefs.nav.title": "Navigation",
  "prefs.nav.pan": "Middle-click (wheel) drag anywhere to pan the canvas.",
  "prefs.nav.box": "Drag on empty space to box-select nodes.",
  "prefs.nav.connect": "Drag from a node's edge to another node to connect them.",
  "prefs.nav.dismiss": "Esc or click outside to dismiss an overlay or selection.",
  "prefs.display.title": "Display",
  "prefs.lang.title": "Language",
  "prefs.sections.title": "Section colors",
  "prefs.sections.reset": "Reset",
  "prefs.sections.resetTip": "Reset to the built-in color",
  "prefs.sections.hue": "{label} hue",
  // node connections panel (N-23)
  "edgesPanel.title": "Connections of {name}",
  "edgesPanel.empty": "This node has no connections yet.",
  "edgesPanel.dependsOn": "Depends on",
  "edgesPanel.requiredBy": "Required by",
  "edgesPanel.comment": "Comment",
  "edgesPanel.delete": "Remove this connection",
  "overlay.edges.tip": "Manage connections",
  "ctx.manageEdges": "Manage connections…",
  // shared
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.delete": "Delete",
  "newModel.title": "New from built-in",
  "newModel.subtitle": "Start a fresh graph from a built-in Strata Graph Model.",
  "newModel.replaceTitle": "Replace current graph?",
  "newModel.replaceBody": "This starts a new graph and discards the unsaved work in the current one. Export it as .sgm first if you want to keep it.",
  "newModel.replace": "Discard and continue",
  "ctx.newModel": "New from built-in…",
  "quickbar.new": "New",
  "tip.new": "Start a new graph from a built-in model",
  "tip.newConnected": "Available in static mode; connected mode follows the scanned project",
};

const dicts: Record<Lang, Dict> = { en };

let current: Lang = "en";

/** Set the active language (from `prefs.lang`); unknown values fall back to en. */
export function setLang(lang: string | undefined): void {
  current = lang && lang in dicts ? (lang as Lang) : "en";
}

/** Translate a key, interpolating `{name}` placeholders from `vars`. Falls back
 *  to English, then to the key itself, so nothing renders blank. */
export function t(key: string, vars?: Record<string, string | number>): string {
  let s = dicts[current]?.[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
