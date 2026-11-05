---
title: Preferences
---

# Preferences

Settings that change how the graph is drawn and colored. Open them from **Edit ▸ Preferences** or the **⚙** toolbar button.

The **Preferences** panel has a category list on the left and the settings for the selected category on the right. Only categories that have real settings are shown.

## General

**Language** sets the interface language. English is the only language today; the interface is built so more can be added without reworking it.

**Canvas layout** sets how sections are arranged. **Horizontal** stacks them as rows top-to-bottom; **vertical** stacks them as columns left-to-right. The same toggle is in **View ▸ Layout**. The view re-fits when you switch, and every node re-arranges into its section for the new orientation. Each orientation keeps its own arrangement: positions you set in one are preserved when you return to it, while a node you never moved in that orientation falls back to the default layout. In each orientation the section central node slides only across its band (up-down when horizontal, left-right when vertical), clamped so it stays inside the band.

This category also lists how you move around the canvas: middle-click (wheel) drag to pan, drag on empty space to box-select nodes, drag from a node's edge to another node to connect them, and <kbd>Esc</kbd> or a click outside to dismiss an overlay or selection.

## Interface

Display toggles for the whole graph:

- **Dim not-generated**: fades placeholder nodes that are expected but do not exist yet, together with their edges and any highlight on them, so real content stands out while the placeholders keep their place in the layout. Also available as the **Dim ∅** toolbar toggle.
- **Not-generated opacity**: how faded those nodes are while dimming is on (5 to 80 percent). Faded nodes stay interactive, so you can still select and edit them.
- **Color edges by section**: edges take the color of the target node's section. Turn it off for neutral gray edges.
- **Show dependency edges**: shows or hides the dependency edges, to declutter a dense graph.
- **Highlight paths on hover**: lights a node's upstream and downstream paths as you hover it. Also the **✦ Paths** toolbar toggle. See [Highlighting](/working/highlighting).
- **Grow bands to dragged content**: lets a band grow to keep a node dragged past its edge, pushing the neighboring bands on that side and growing the shared direction for every band. Turn it off to freeze the bands where they are and confine nodes to them. Also the **⇲ Grow** toolbar toggle. See [Sections](/modeling/sections).

## Sections

A hue control for every section. A **section** is a band that groups nodes; each one carries a color used for its band, its nodes, and the edges that point into it.

Drag a section's slider to recolor it. Bands, nodes, and edges update live as you drag. When a section uses a custom color, a **Reset** control appears next to it that returns the section to the color defined by its built-in model.

::: tip
Section colors are a display override. They never change the underlying **Strata Graph Model**, so exporting to `.sgm` keeps the model's own colors.
:::

## Where they are stored

Preferences and section colors are saved per project (in `localStorage` in **Static** mode, in the state file in **Connected** mode). They affect display only; they never change the model.

::: info
The **View** menu mirrors the Interface toggles with a check mark, so you can flip them without opening the Preferences panel.
:::

## Next

- [Themes](/working/themes)
- [Sections](/modeling/sections)
- [The interface](/getting-started/the-interface)
