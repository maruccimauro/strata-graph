---
title: Importing files
---

# Importing files

Turn real files into nodes, and open them back from the graph.

## Drop a file on the canvas

Drag a file from your operating system onto the canvas. A manual node is created at the drop point, labeled with the file name.

## Pick a file with ＋ Node

In **Connected** mode, **＋ Node** opens a native file picker so you can choose a file; the node keeps the real path. In **Static** mode, **＋ Node** asks for a name instead. See [Static and Connected modes](/models-data/modes).

## Open file, open folder

In Connected mode, a node's overlay lists its associated files. Each file has:

- **📄 Open file**: opens the file with the OS default app.
- **📁 Open folder**: reveals the file in the file manager.

## Cross-platform

The native picker and open actions use per-OS tools:

| Action | Windows | macOS | Linux |
|---|---|---|---|
| open file / folder | `explorer` | `open` | `xdg-open` |
| native file picker | PowerShell | `osascript` | `zenity` / `kdialog` |

If no Linux picker is installed, **＋ Node** falls back to a name prompt.

## Next

- [Static and Connected modes](/models-data/modes)
- [The data folder](/models-data/data-folder)
