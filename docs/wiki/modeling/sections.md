---
title: Sections
---

# Sections

Sections are the horizontal bands that group your nodes. Every node belongs to one section (or none).

## What a section is

A **section** has an id, a label, a color (an HSL hue the editor turns into band and accent colors), and an order. Sections stack top to bottom as colored **bands** across the canvas.

Each section has a **central node**: a solid, labeled node that sits in the band and summarizes it.

## The central node counts

The central node shows two counts:

- **AUTO generated/total**: of the nodes produced by the built-in model or scan, how many exist. Unavailable nodes are excluded from this count.
- **MANUAL +n**: how many nodes you added yourself.

The central node moves only across its band and stays anchored on the other axis: in a horizontal layout it slides up and down, in a vertical layout it slides left and right. Its travel is clamped to the band, so it never leaves its own section.

## Bands grow to their content

A band is sized to the box that its nodes occupy. Drag a node past a band edge and the band grows to keep it inside, live, while you drag; drag the node back and the band shrinks again, reclaiming the empty space on either side.

Growth pushes only the side it needs. Along the stacking direction (top to bottom in a horizontal layout, left to right in a vertical one), a band that grows toward the end pushes the bands after it, and a band that grows toward the start pushes the bands before it, so nothing overlaps. Along the shared direction (the band width in a horizontal layout, the band height in a vertical one) every band shares one range, so a node dragged far out makes all the bands grow together, in either direction.

Each orientation remembers its own arrangement, so growing a band in the horizontal layout does not affect the vertical one.

This is on by default. Toggle **Grow bands to dragged content** from the **View** menu, the quick bar (**⇲ Grow**), the background right-click menu, or **Preferences ▸ Display**. When it is off, a node is confined to its band instead of growing it.

::: info
Moving a node to another section with the **Section** list places it in the target band's grid, rather than keeping its old spot.
:::

## Assigning a node to a section

Open a node's overlay and pick a section from the **Section** list (a filterable combobox). Choose `— none —` to make the node free-floating. See [Nodes](/modeling/nodes).

::: info
Sections come from the built-in model you start from. SDLC, the first built-in model, defines ten sections (Client, Discovery, Requirements, and so on). See [Built-in models](/models-data/built-in-models).
:::

## Next

- [Nodes](/modeling/nodes)
- [Edges](/modeling/edges)
