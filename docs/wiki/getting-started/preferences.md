---
title: Preferences
---

# Preferences

View options that change how the graph is drawn. Open them from **Edit ▸ Preferences** or the **⚙** toolbar button.

## Options

- **Hide not-generated**: hides placeholder nodes that are expected but do not exist yet, so you see only real content. Also available as the **Hide ∅** toolbar toggle.
- **Color edges by section**: edges take the color of the target node's section. Turn it off for neutral gray edges.
- **Show dependency edges**: shows or hides the dependency edges, to declutter a dense graph.

## Where they are stored

Preferences are saved and reused across projects (in `localStorage` in Static mode, in the state file in Connected mode). They affect display only; they never change the model.

::: info
The **View** menu mirrors these toggles with a check mark, so you can flip them without opening the Preferences panel.
:::

## Next

- [Themes](/working/themes)
- [The interface](/getting-started/the-interface)
