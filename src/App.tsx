import { useEffect, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Editor } from "./editor/Editor";
import { buildSdlcModel } from "./models/sdlc";
import { boot as runBoot, type Boot } from "./editor/api";
import { MUTED } from "./editor/theme";

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

  useEffect(() => {
    void runBoot(demo).then(setData);
  }, [demo]);

  if (!data) return <div style={{ padding: 16, color: MUTED }}>Loading…</div>;

  return (
    <ReactFlowProvider>
      <Editor boot={data} />
    </ReactFlowProvider>
  );
}
