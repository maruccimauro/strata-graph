import type { GraphModel } from "../core/types";
import { buildSdlcModel, SDLC_BASE_ID } from "./sdlc";
import { buildBoardModel, BOARD_BASE_ID } from "./board";

export { SDLC_BASE_ID } from "./sdlc";
export { BOARD_BASE_ID } from "./board";

/**
 * Registry of built-in Strata Graph Models. Each entry can produce a fresh
 * ("clean") GraphModel to start from. The editor reads this list for the
 * "New from built-in" picker, so adding a model needs no editor change.
 */
export interface BuiltInModel {
  /** stored in GraphModel.meta.base. */
  id: string;
  label: string;
  description: string;
  /** build a fresh model to start a new graph from. */
  build(opts?: { name?: string }): GraphModel;
}

export const BUILTIN_MODELS: BuiltInModel[] = [
  {
    id: SDLC_BASE_ID,
    label: "SDLC",
    description:
      "Software lifecycle: stage sections from Client to Closure, with the deliverables and their dependencies. Starts with nothing generated yet.",
    build: (opts) => buildSdlcModel({ name: opts?.name ?? "SDLC project", clean: true }),
  },
  {
    id: BOARD_BASE_ID,
    label: "Task board",
    description:
      "Generic board: columns from Backlog to Done, with a few example cards and dependencies. Shows the engine outside any domain.",
    build: (opts) => buildBoardModel({ name: opts?.name ?? "Task board" }),
  },
];

export function getBuiltIn(id: string): BuiltInModel | undefined {
  return BUILTIN_MODELS.find((m) => m.id === id);
}

/** The SDLC demo graph (status mix), used for "Load demo" and first-run. */
export function buildDemoModel(): GraphModel {
  return buildSdlcModel({ name: "Demo project" });
}
