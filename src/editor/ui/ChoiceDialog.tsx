import { Panel, Button } from "./primitives";
import { MUTED } from "../theme";
import { t } from "../i18n";

export interface ChoiceAction {
  label: string;
  variant?: "primary" | "ghost" | "danger";
  onClick: () => void;
}

export interface ChoiceDialogProps {
  title: string;
  message: string;
  /** action buttons, rendered left to right after the Cancel button. */
  actions: ChoiceAction[];
  cancelLabel?: string;
  onCancel: () => void;
}

/** A confirmation dialog that offers more than one action (e.g. the band-delete
 *  entry: migrate / delete, and the M3 deletion: track / do not track). Keeps the
 *  same shape as ConfirmDialog but with an arbitrary set of buttons. */
export function ChoiceDialog({ title, message, actions, cancelLabel, onCancel }: ChoiceDialogProps) {
  return (
    <Panel title={title} onClose={onCancel} style={{ left: "50%", top: "32%", transform: "translateX(-50%)", minWidth: 320, maxWidth: 420 }}>
      <div style={{ fontSize: ".85rem", color: MUTED, lineHeight: 1.5 }}>{message}</div>
      {/* Actions stack full width, one per row: the labels here are long (e.g.
          "Delete and track broken links"), so a right-aligned wrapping row reads as
          a disorganized jumble. The vertical sheet keeps each choice legible. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        {actions.map((a, i) => (
          <Button key={i} variant={a.variant ?? "primary"} onClick={a.onClick} style={{ width: "100%", justifyContent: "center" }}>{a.label}</Button>
        ))}
        <Button variant="ghost" onClick={onCancel} style={{ width: "100%", justifyContent: "center" }}>{cancelLabel ?? t("common.cancel")}</Button>
      </div>
    </Panel>
  );
}
