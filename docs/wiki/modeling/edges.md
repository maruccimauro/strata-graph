---
title: Edges
---

# Edges

Edges are dependencies between nodes. The source is the prerequisite; the target depends on it.

## Direction

An edge runs from the **source** (upstream, the prerequisite) to the **target** (downstream, the thing that depends on it). A small dot marks the source end and the arrow points at the target, so the direction reads at a glance from either end.

## Create an edge

There are two ways:

1. **Drag to connect**: drag from the border of one node onto another. Each document node exposes eight connection points on hover (the four side centers and the four corners), so you can start a drag from whichever point faces the other node. A direction dialog asks how they relate: _A depends on B_, _B depends on A_, or a _comment link_ (no dependency).
2. **The Connect panel**: open a node's overlay and choose **🔗 Connect**. Pick the direction, filter by section, and choose the target node. This is the reliable path when nodes are far apart.

## How edges look

- Edges are **floating**: they attach to the node border nearest the other node and follow nodes as you move them.
- By default an edge takes the color of its **target** section (switch this off in [Preferences](/getting-started/preferences)).
- An edge touching a not-generated node is drawn red dashed.

## Branch edges

A node with no incoming dependency is linked to its section's central node by a thin **branch** edge. Branch edges are structural and cannot be deleted.

## Select, delete and reconnect

- **Select**: click an edge to select it. The selected edge lights up with a soft glow and shows a small ring at each real endpoint, marking where it attaches and the two retarget points. Click it again, press `Escape`, or click an empty area to deselect.
- **Delete**: with an edge selected, press `Delete` or `Backspace` to remove it. Deletes are undoable with `Ctrl+Z`. Branch edges cannot be deleted. You can also delete from the edge overlay's trash action.
- **Reconnect (retarget)**: move one end of an edge to a different node from the **edge overlay** (double-click the edge to open it). Next to each end, the **⌖** button starts a retarget: the overlay hides, a line follows the cursor from the end that stays fixed, and clicking a node sets the new endpoint. Press `Escape` or click empty space to cancel and reopen the overlay. The same actions live in the edge's [context menu](/working/context-menus). The dependency rebinds to the new node; if the edge came from the built-in model it becomes a manual edge, so the change persists. Retargeting the only incoming dependency away from a node turns that node into a section root, so it reattaches to its section's central node with a branch edge.

## Inspect

**Double-click** an edge to open the **edge overlay** (or hold <kbd>Alt</kbd> and hover it for a transient one); a single click selects the edge. The overlay names the depends-on and dependent nodes with their sections, and offers a delete action for non-branch edges. See [Overlays and actions](/working/overlays-and-actions).

## Next

- [Comments](/modeling/comments)
- [Highlighting](/working/highlighting)
