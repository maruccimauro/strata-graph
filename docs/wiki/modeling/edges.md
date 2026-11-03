---
title: Edges
---

# Edges

Edges are dependencies between nodes. The source is the prerequisite; the target depends on it.

## Direction

An edge runs from the **source** (upstream, the prerequisite) to the **target** (downstream, the thing that depends on it). The arrow points at the target.

## Create an edge

There are two ways:

1. **Drag to connect**: drag from the border of one node onto another. A direction dialog asks how they relate: _A depends on B_, _B depends on A_, or a _comment link_ (no dependency).
2. **The Connect panel**: open a node's overlay and choose **🔗 Connect**. Pick the direction, filter by section, and choose the target node. This is the reliable path when nodes are far apart.

## How edges look

- Edges are **floating**: they attach to the node border nearest the other node and follow nodes as you move them.
- By default an edge takes the color of its **target** section (switch this off in [Preferences](/getting-started/preferences)).
- An edge touching a not-generated node is drawn red dashed.

## Branch edges

A node with no incoming dependency is linked to its section's central node by a thin **branch** edge. Branch edges are structural and cannot be deleted.

## Inspect and delete

Hover an edge to open the **edge overlay**: it names the depends-on and dependent nodes with their sections, and offers a delete action for non-branch edges. See [Overlays and actions](/working/overlays-and-actions).

## Next

- [Comments](/modeling/comments)
- [Highlighting](/working/highlighting)
