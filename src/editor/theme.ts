/** Theme tokens. The flat UI colors are CSS variables (see styles.css) so they
 *  switch instantly with `document.documentElement.dataset.theme`. The per-hue
 *  section colors are computed in JS and read the current theme live, so they
 *  update when the canvas rebuilds on a theme toggle. */

export function isDark(): boolean {
  if (typeof document !== "undefined") {
    const t = document.documentElement.dataset.theme;
    if (t === "dark") return true;
    if (t === "light") return false;
  }
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function bandBg(h: number): string {
  return isDark() ? `hsl(${h} 42% 20%)` : `hsl(${h} 58% 89%)`;
}
export function accent(h: number): string {
  return isDark() ? `hsl(${h} 60% 63%)` : `hsl(${h} 54% 40%)`;
}
export function docBg(h: number): string {
  return isDark() ? `hsl(${h} 30% 19%)` : `hsl(${h} 48% 97%)`;
}

// Concrete (non-var) colors for SVG edges/markers, recomputed on theme rebuild.
export function ghostCol(): string {
  return isDark() ? "#ef7b85" : "#c0392b";
}
export function mutedCol(): string {
  return isDark() ? "#9fb0bd" : "#5a6b78";
}
export function upCol(): string {
  return isDark() ? "#2ec4c4" : "#0a7d7d";
}
export function downCol(): string {
  return isDark() ? "#e8a35a" : "#d98410";
}

// Flat tokens as CSS-variable references (theme handled by CSS).
export const INK = "var(--ink)";
export const MUTED = "var(--muted)";
export const GHOST = "var(--ghost)";
export const PANEL = "var(--panel)";
export const LINE = "var(--line)";
export const UP = "var(--up)";
export const DOWN = "var(--down)";
export const ACCENT = "var(--accent)";
