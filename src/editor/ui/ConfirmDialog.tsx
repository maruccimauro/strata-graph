import { Panel, Button } from "./primitives";
import { MUTED } from "../theme";
import { t } from "../i18n";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small reusable confirmation dialog for destructive or irreversible actions
 *  (e.g. replacing the current graph). Keeps a consistent shape across the app
 *  instead of using the native window.confirm. */
export function ConfirmDialog({ title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Panel title={title} onClose={onCancel} style={{ left: "50%", top: "32%", transform: "translateX(-50%)", minWidth: 300, maxWidth: 380 }}>
      <div style={{ fontSize: ".85rem", color: MUTED, lineHeight: 1.5 }}>{message}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 14 }}>
        <Button variant="ghost" onClick={onCancel}>{cancelLabel ?? t("common.cancel")}</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel ?? t("common.confirm")}</Button>
      </div>
    </Panel>
  );
}
