/**
 * Strata connected-mode server (Node/TS, run with tsx). Serves the built app
 * and a small API: real graph scan, layout-state persistence, open file/folder,
 * and a native file picker (Windows via PowerShell). Localhost only.
 *
 *   npx tsx src/server/index.ts --root <projectWithDocs> [--port 8777]
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync, writeFileSync, statSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile, execFileSync } from "node:child_process";
import { scan } from "./scanner";
import { buildSdlcModel } from "../models/sdlc";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIST = join(REPO_ROOT, "dist", "index.html");
const STATE_FILE = ".strata-state.json";

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const ROOT = resolve(arg("root", process.cwd()));
const PORT = parseInt(arg("port", "8777"), 10);

function loadState(): unknown {
  const f = join(ROOT, "docs", STATE_FILE);
  if (existsSync(f)) {
    try {
      return JSON.parse(readFileSync(f, "utf8"));
    } catch {
      /* ignore */
    }
  }
  return {};
}
function saveState(data: unknown): void {
  const dir = join(ROOT, "docs");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, STATE_FILE), JSON.stringify(data, null, 2), "utf8");
}

function hasCmd(cmd: string): boolean {
  const probe = process.platform === "win32" ? "where" : "which";
  try {
    execFileSync(probe, [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Native "open file" dialog, cross-platform. Windows: PowerShell. macOS:
 *  osascript. Linux: zenity or kdialog. Returns null if the tool is missing so
 *  the client can fall back to a manual-name prompt. */
function nativePick(): string | null {
  try {
    if (process.platform === "win32") {
      const ps = [
        "Add-Type -AssemblyName System.Windows.Forms;",
        "$d = New-Object System.Windows.Forms.OpenFileDialog;",
        `$d.InitialDirectory = '${ROOT.replace(/'/g, "''")}';`,
        "$d.Title = 'Pick a file for the new node';",
        "if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.FileName }",
      ].join(" ");
      return execFileSync("powershell", ["-NoProfile", "-STA", "-Command", ps], { encoding: "utf8" }).trim() || null;
    }
    if (process.platform === "darwin") {
      const script = `set f to choose file with prompt "Pick a file for the new node" default location (POSIX file "${ROOT}")\nPOSIX path of f`;
      return execFileSync("osascript", ["-e", script], { encoding: "utf8" }).trim() || null;
    }
    // linux
    if (hasCmd("zenity")) {
      return execFileSync("zenity", ["--file-selection", `--filename=${ROOT}/`, "--title=Pick a file for the new node"], { encoding: "utf8" }).trim() || null;
    }
    if (hasCmd("kdialog")) {
      return execFileSync("kdialog", ["--getopenfilename", ROOT], { encoding: "utf8" }).trim() || null;
    }
    return null;
  } catch (e) {
    // non-zero exit from a dialog usually means the user cancelled
    const msg = String(e);
    if (/cancel|exit code 1|status 1/i.test(msg)) return null;
    throw e;
  }
}

function pickFile(): { abspath: string; relpath: string | null; name: string } | { cancelled: true } | { error: string } {
  try {
    const out = nativePick();
    if (!out) return { cancelled: true };
    const abspath = resolve(out);
    const rel = abspath.startsWith(resolve(ROOT)) ? abspath.slice(resolve(ROOT).length + 1) : null;
    return { abspath, relpath: rel ? rel.split("\\").join("/") : null, name: abspath.split(/[\\/]/).pop() ?? abspath };
  } catch (e) {
    return { error: String(e) };
  }
}

function openPath(rel: string, kind: "file" | "folder"): { ok: true } | { error: string } {
  let p = resolve(ROOT, rel);
  if (!p.startsWith(resolve(ROOT))) return { error: "outside the project" };
  if (!existsSync(p)) return { error: "does not exist" };
  const isFile = statSync(p).isFile();
  if (process.platform === "win32") {
    if (kind === "folder") {
      if (isFile) execFile("explorer", ["/select,", p]);
      else execFile("explorer", [p]);
    } else {
      execFile("cmd", ["/c", "start", "", p]);
    }
  } else {
    const opener = process.platform === "darwin" ? "open" : "xdg-open";
    const target = kind === "folder" && isFile ? dirname(p) : p;
    execFile(opener, [target]);
  }
  return { ok: true };
}

function sendJson(res: ServerResponse, obj: unknown, code = 200): void {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((ok) => {
    let raw = "";
    req.on("data", (c: Buffer) => (raw += c));
    req.on("end", () => {
      try {
        ok(raw ? JSON.parse(raw) : {});
      } catch {
        ok({});
      }
    });
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;

  if (req.method === "GET" && (path === "/" || path === "/index.html")) {
    if (!existsSync(DIST)) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Build not found. Run `npm run build` before `npm run serve`.");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(readFileSync(DIST));
    return;
  }
  if (req.method === "GET" && path === "/api/ping") {
    sendJson(res, { ok: true, mode: "connected", name: scan(ROOT).name });
    return;
  }
  if (req.method === "GET" && path === "/api/graph") {
    const result = scan(ROOT);
    sendJson(res, { graph: buildSdlcModel({ scan: result }), state: loadState(), root: ROOT });
    return;
  }
  if (req.method === "GET" && path === "/api/pick-file") {
    sendJson(res, pickFile());
    return;
  }
  if (req.method === "POST" && path === "/api/state") {
    saveState(await readBody(req));
    sendJson(res, { ok: true });
    return;
  }
  if (req.method === "POST" && path === "/api/open") {
    const body = (await readBody(req)) as { path?: string; kind?: "file" | "folder" };
    sendJson(res, openPath(body.path ?? "", body.kind === "folder" ? "folder" : "file"));
    return;
  }
  sendJson(res, { error: "not found" }, 404);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Strata (connected) -> http://127.0.0.1:${PORT}/`);
  console.log(`Project root: ${ROOT}`);
  console.log("Ctrl+C to stop.");
});
