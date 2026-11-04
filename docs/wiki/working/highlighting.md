---
title: Highlighting
---

# Highlighting

See how a node connects to the rest of the graph, either by selecting it or by hovering it. The two read differently on purpose.

## Selection highlight

When you **select** a node (single click), Strata traces its dependency chain in both directions:

- **What it depends on** (prerequisites, upstream) and **what it unblocks** (dependents, downstream) are marked with a thicker stroke, each direction in its own color.
- Everything unrelated **dims**, so the chain stands out.

The chain follows the whole graph, not just direct neighbors: ancestors and descendants are included. Clear it by clicking the node again, clicking empty space, or pressing <kbd>Esc</kbd>.

## Hover preview (Paths)

With **Highlight paths on hover** on, moving the pointer over a node lights **only** its upstream (prerequisite) and downstream (dependent) paths, end to end, with a soft glow. Unlike selection, the hover preview **does not dim** the rest of the graph and **does not select** the node: it is a transient preview that clears as soon as you leave the node.

Hovering a single edge glows that edge in its own color.

Upstream and downstream use different colors in both selection and hover, so you can tell prerequisites from dependents at a glance.

## Turn Paths on or off

**Highlight paths on hover** is on by default and can be toggled in four places:

- The **✦ Paths** button in the quick toolbar.
- **View ▸ Highlight paths on hover**.
- **Preferences ▸ Interface ▸ Display**.
- The background **right-click** menu. See [Context menus](/working/context-menus).

::: tip
Use **Show dependency edges** in [Preferences](/getting-started/preferences) to hide all dependency edges when you want to focus on structure alone.
:::

## Next

- [Undo and redo](/working/undo-redo)
- [Edges](/modeling/edges)
