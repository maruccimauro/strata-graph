---
title: Highlighting
---

# Highlighting

Click a node to see how it connects to the rest of the graph.

## What gets highlighted

When you select a node, Strata traces the dependency edges in both directions:

- **What it depends on** (its prerequisites, upstream) is highlighted one way.
- **What it unblocks** (its dependents, downstream) is highlighted the other way.
- Everything unrelated **dims**, so the chain stands out.

The highlight follows the whole chain, not just direct neighbors: ancestors and descendants are included.

## Edge emphasis

Edges along the highlighted chain are drawn thicker and in a distinct color; upstream and downstream use different styles so you can tell prerequisites from dependents at a glance.

## Clear it

Click the node again, click empty space, or press <kbd>Esc</kbd>.

::: tip
Use **Show dependency edges** in [Preferences](/getting-started/preferences) to hide all dependency edges when you want to focus on structure alone.
:::

## Next

- [Undo and redo](/working/undo-redo)
- [Edges](/modeling/edges)
