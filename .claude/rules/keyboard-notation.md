# Rule: Keyboard and pointer notation (HARD)

Every reference to a keyboard key, or a key combined with a pointer action, in
**user-facing text** (UI strings through `t()`, tooltips, the wiki, and any other
public copy) is written as a single bracketed token.

## Format

- Wrap the whole shortcut in square brackets: `[ ... ]`.
- Write keyboard key names in **UPPERCASE**: `ALT`, `CTRL`, `SHIFT`, `ESC`,
  `ENTER`, `DELETE`, `BACKSPACE`, `N`, `Z`, and so on.
- Write pointer actions in **Title Case** words: `Mouse Hover`, `Left Click`,
  `Right Click`, `Double Click`, `Drag`.
- Join the parts of a combination with ` + ` (space, plus, space).

## Examples

- `[ALT + Mouse Hover]`
- `[CTRL + Z]`
- `[DELETE]`
- `[ESC]`
- `[N]`
- `[Right Click]`
- `[DOUBLE Click]` is wrong; use `[Double Click]` (pointer action, Title Case).
- `Ctrl+Z`, `Alt`, `<kbd>Delete</kbd>` are wrong; use the bracketed form.

## Scope

Applies to the editor UI and the public wiki. When closing a feature, verify that
no new shortcut reference was left in another form, and migrate existing ones
incrementally.
