import { Panel } from "./ui/primitives";
import { MUTED } from "./theme";
import { t } from "./i18n";
import { BUILTIN_MODELS } from "../models";

export interface NewModelPanelProps {
  onPick: (builtInId: string) => void;
  onClose: () => void;
}

/** Built-in model picker: lists the registered built-in Strata Graph Models and
 *  starts a fresh graph from the chosen one. */
export function NewModelPanel({ onPick, onClose }: NewModelPanelProps) {
  return (
    <Panel title={t("newModel.title")} onClose={onClose} style={{ left: "50%", top: "28%", transform: "translateX(-50%)", minWidth: 320, maxWidth: 420 }}>
      <div style={{ fontSize: ".8rem", color: MUTED, marginBottom: 10 }}>{t("newModel.subtitle")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {BUILTIN_MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => onPick(m.id)}
            style={{
              font: "inherit",
              textAlign: "left",
              cursor: "pointer",
              border: "1px solid var(--line)",
              borderRadius: 10,
              background: "var(--panel, #fff)",
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: ".9rem" }}>{m.label}</span>
            <span style={{ fontSize: ".78rem", color: MUTED, lineHeight: 1.45 }}>{m.description}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}
