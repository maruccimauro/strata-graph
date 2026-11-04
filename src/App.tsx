import { useEffect, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Editor } from "./editor/Editor";
import { getBuiltIn, buildDemoModel, SDLC_BASE_ID } from "./models";
import { boot as runBoot, loadStartup, saveStartup, type Boot, type Startup } from "./editor/api";
import { MUTED } from "./editor/theme";
import type { GraphModel } from "./core/types";

// apply a previously chosen theme before first paint
try {
  const t = localStorage.getItem("strata-theme");
  if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
} catch {
  /* ignore */
}

/** Build the static-mode starting graph from the saved startup choice. First run
 *  (no saved choice) starts a clean SDLC project and the editor offers the demo. */
function initialStaticModel(startup: Startup | null): GraphModel {
  if (startup?.demo) return buildDemoModel();
  const bi = startup ? getBuiltIn(startup.base) : getBuiltIn(SDLC_BASE_ID);
  return (bi ?? getBuiltIn(SDLC_BASE_ID)!).build();
}

export default function App() {
  const startup = useMemo(() => loadStartup(), []);
  const initial = useMemo(() => initialStaticModel(startup), [startup]);
  const [data, setData] = useState<Boot | null>(null);
  const [bootKey, setBootKey] = useState(0);
  const [firstRun, setFirstRun] = useState(false);

  useEffect(() => {
    void runBoot(initial).then((b) => {
      setData(b);
      // Only ask about the demo in static mode and only the first time.
      if (b.mode === "static" && startup === null) setFirstRun(true);
    });
  }, [initial, startup]);

  if (!data) return <div style={{ padding: 16, color: MUTED }}>Loading…</div>;

  // Load a model as the current graph with a fresh editor state, remounting the
  // editor so nothing from the previous model leaks in. When a startup choice is
  // given, remember it so the next open restores the same model.
  const onLoadModel = (model: GraphModel, choice?: Startup) => {
    setData({ mode: data.mode, graph: model, state: {}, root: data.root });
    setBootKey((k) => k + 1);
    setFirstRun(false);
    if (choice) saveStartup(choice);
  };

  // First-run demo choice: yes loads the demo, no keeps the clean project.
  const onChooseStartup = (demo: boolean) => {
    if (demo) onLoadModel(buildDemoModel(), { base: SDLC_BASE_ID, demo: true });
    else {
      saveStartup({ base: SDLC_BASE_ID, demo: false });
      setFirstRun(false);
    }
  };

  return (
    <ReactFlowProvider>
      <Editor key={bootKey} boot={data} onLoadModel={onLoadModel} firstRun={firstRun} onChooseStartup={onChooseStartup} />
    </ReactFlowProvider>
  );
}
