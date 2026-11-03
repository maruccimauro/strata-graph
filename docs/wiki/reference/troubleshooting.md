---
title: Troubleshooting
---

# Troubleshooting

## The badge says Static, but I ran the server

The app reaches the server only when it is served by it. Build first, then serve, and open the server's URL (not the Vite dev URL):

```bash
npm run build
npm run serve -- --root <project>
```

## ＋ Node does not open a file picker

A native picker is a Connected-mode feature. In Static mode, **＋ Node** asks for a name. On Linux, install `zenity` or `kdialog`; without one, **＋ Node** falls back to a name prompt.

## Importing a file does nothing or shows an error

Imports must be valid `.sgm` files. An invalid or wrong-version file is rejected with a message and the current graph is kept. See [The .sgm format](/reference/sgm-format).

## My positions or locks disappeared

In Static mode, state lives in the browser's `localStorage`; clearing site data removes it. Export a [Strata Graph Model](/models-data/strata-graph-model) to keep a durable copy.

## The overlay does not appear when I hover a node

The overlay is suppressed over a node's border, where the connection handles sit. Hover the node's interior, or double-click it. See [Overlays and actions](/working/overlays-and-actions).

## Next

- [Static and Connected modes](/models-data/modes)
- [Keyboard shortcuts](/reference/keyboard-shortcuts)
