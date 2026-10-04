import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import "./AdminUi.css";

interface Props {
  open: boolean;
  title: string;
  message: string;
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, icon, confirmLabel = "Oui", cancelLabel = "Non", onConfirm, onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="mwx-dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="mwx-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="mwx-dialog-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {icon && <div className="mwx-dialog-icon">{icon}</div>}
            <h2 id="mwx-dialog-title">{title}</h2>
            <p>{message}</p>
            <div className="mwx-dialog-actions">
              <button type="button" className="mwx-btn-cancel" onClick={onCancel} autoFocus>{cancelLabel}</button>
              <button type="button" className="mwx-btn-danger" onClick={onConfirm}>{confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}