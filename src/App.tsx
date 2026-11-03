import { useEffect, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Editor } from "./editor/Editor";
import { buildSdlcModel } from "./models/sdlc";
import { boot as runBoot, type Boot } from "./editor/api";
import { MUTED } from "./editor/theme";
import type { GraphModel } from "./core/types";

// apply a previously chosen theme before first paint
try {
  const t = localStorage.getItem("strata-theme");
  if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
} catch {
  /* ignore */
}

export default function App() {
  const demo = useMemo(() => buildSdlcModel({ name: "Demo project" }), []);
  const [data, setData] = useState<Boot | null>(null);
  const [bootKey, setBootKey] = useState(0);

  useEffect(() => {
    void runBoot(demo).then(setData);
  }, [demo]);

  if (!data) return <div style={{ padding: 16, color: MUTED }}>Loading…</div>;

  // Load an imported .sgm as the current graph with a fresh editor state,
  // remounting the editor so nothing from the previous model leaks in.
  const onLoadModel = (model: GraphModel) => {
    setData({ mode: data.mode, graph: model, state: {}, root: data.root });
    setBootKey((k) => k + 1);
  };

  return (
    <ReactFlowProvider>
      <Editor key={bootKey} boot={data} onLoadModel={onLoadModel} />
    </ReactFlowProvider>
  );
}
