/**
 * Filesystem scanner (connected mode). Scans a project's docs/ against the SDLC
 * canon and reports which documents exist, any extra docs on disk, and edges
 * discovered from real Markdown links (the hybrid refinement). Node-only; the
 * browser never runs this.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve, relative, dirname } from "node:path";
import { SECTIONS, DOCUMENTS } from "../models/sdlc/canon";

export interface GeneratedInfo {
  path: string; // relative to docs/, posix
  abspath: string;
  count: number;
}
export interface ExtraNode {
  id: string;
  section: string;
  label: string;
  path: string;
  abspath: string;
}
export interface ScanResult {
  name: string;
  generated: Record<string, GeneratedInfo>;
  extras: ExtraNode[];
  linkEdges: [string, string][];
}

const SKIP_NAMES = new Set(["README.md"]);
const LINK_RE = /(?<!\!)\[[^\]]*\]\(([^)#\s]+)/g;

function toPosix(p: string): string {
  return p.split("\\").join("/");
}

/** Resolve a canon `files` pattern (relative to docs/) to absolute file paths. */
function matchFiles(docsDir: string, pattern: string): string[] {
  if (!pattern.includes("*")) {
    const f = join(docsDir, pattern);
    return existsSync(f) ? [f] : [];
  }
  const slash = pattern.lastIndexOf("/");
  const dirPart = slash >= 0 ? pattern.slice(0, slash) : "";
  const filePart = slash >= 0 ? pattern.slice(slash + 1) : pattern;
  const dir = join(docsDir, dirPart);
  if (!existsSync(dir)) return [];
  const rx = new RegExp(
    "^" + filePart.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
  );
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && rx.test(e.name))
      .map((e) => join(dir, e.name));
  } catch {
    return [];
  }
}

function projectName(root: string): string {
  const claude = join(root, "CLAUDE.md");
  if (existsSync(claude)) {
    try {
      const m = readFileSync(claude, "utf8").match(
        /\*\*Project name:\*\*\s*`?([^`\n<]+)`?/,
      );
      if (m) {
        const name = m[1].trim();
        if (name && name !== "<name>" && name !== "<Project Name>") return name;
      }
    } catch {
      /* ignore */
    }
  }
  return root.split(/[\\/]/).filter(Boolean).pop() ?? "project";
}

export function scan(root: string): ScanResult {
  const docsDir = join(root, "docs");
  const generated: Record<string, GeneratedInfo> = {};
  const extras: ExtraNode[] = [];
  const claimed = new Set<string>();
  const fileToNode = new Map<string, string>(); // rel posix -> node id

  // 1. canon docs
  for (const d of DOCUMENTS) {
    const found = d.files.flatMap((p) => matchFiles(docsDir, p));
    const uniq = [...new Set(found)].sort();
    if (uniq.length) {
      const rel = toPosix(relative(docsDir, uniq[0]));
      generated[d.id] = { path: rel, abspath: uniq[0], count: uniq.length };
      for (const f of uniq) {
        const r = toPosix(relative(docsDir, f));
        claimed.add(r);
        fileToNode.set(r, d.id);
      }
    }
  }

  // 2. extras (real .md not in the canon)
  for (const s of SECTIONS) {
    const folder = join(docsDir, s.id);
    if (!existsSync(folder)) continue;
    let entries: string[] = [];
    try {
      entries = readdirSync(folder, { recursive: true }) as string[];
    } catch {
      continue;
    }
    for (const e of entries) {
      const name = toPosix(e);
      if (!name.endsWith(".md")) continue;
      const base = name.split("/").pop()!;
      if (SKIP_NAMES.has(base) || base.startsWith("_TEMPLATE") || base.startsWith(".")) continue;
      const rel = `${s.id}/${name}`;
      if (claimed.has(rel)) continue;
      const abspath = join(folder, e);
      const id = `extra:${rel}`;
      extras.push({ id, section: s.id, label: base.replace(/\.md$/, ""), path: rel, abspath });
      fileToNode.set(rel, id);
    }
  }

  // 3. link refinement: B links to A  =>  edge A -> B (A upstream of B)
  const linkEdges: [string, string][] = [];
  const seen = new Set<string>();
  const allFiles: { id: string; abspath: string }[] = [
    ...Object.entries(generated).map(([id, g]) => ({ id, abspath: g.abspath })),
    ...extras.map((e) => ({ id: e.id, abspath: e.abspath })),
  ];
  for (const { id, abspath } of allFiles) {
    let content = "";
    try {
      content = readFileSync(abspath, "utf8");
    } catch {
      continue;
    }
    for (const m of content.matchAll(LINK_RE)) {
      const target = m[1];
      if (/^(https?:|mailto:)/.test(target)) continue;
      const abs = resolve(dirname(abspath), target);
      const rel = toPosix(relative(docsDir, abs));
      if (rel.startsWith("..")) continue;
      const other = fileToNode.get(rel);
      if (other && other !== id) {
        const key = `${other}->${id}`;
        if (!seen.has(key)) {
          seen.add(key);
          linkEdges.push([other, id]);
        }
      }
    }
  }

  return { name: projectName(root), generated, extras, linkEdges };
}
