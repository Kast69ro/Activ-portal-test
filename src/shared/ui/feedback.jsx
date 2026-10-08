/**
 * FeedbackProvider: тосты (Snackbar) и диалог подтверждения. Подключается один раз в App.jsx;
 * в компонентах — через хуки useToast / useConfirm.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import { useRetained } from "@/shared/lib/useRetained";
import { ConfirmContext, ToastContext } from "./feedbackContext";

/*
 * Уведомления и подтверждения для всего приложения.
 *
 *   const toast = useToast();
 *   toast.success(t("saved"));
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: t("deleteTitle"), danger: true })) remove(id);
 */

export function FeedbackProvider({ children }) {
  const { t } = useTranslation();

  // ─── Тосты: показываем по одному, остальные ждут в очереди ───
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [open, setOpen] = useState(false);

  if (!current && queue.length) {
    setCurrent(queue[0]);
    setQueue((q) => q.slice(1));
    setOpen(true);
  }

  const push = useCallback((severity, message) => {
    if (message) setQueue((q) => [...q, { key: Date.now() + Math.random(), severity, message }]);
  }, []);

  const toast = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      warning: (m) => push("warning", m),
      info: (m) => push("info", m),
    }),
    [push],
  );

  // ─── Подтверждение: промис, который резолвится true/false ───
  const [dialog, setDialog] = useState(null);
  // Пока окно закрывается, показываем прежние тексты — иначе заголовок и кнопки сменятся посреди анимации
  const shownDialog = useRetained(dialog);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialog(options);
      }),
    [],
  );

  const closeDialog = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        <Snackbar
          key={current?.key}
          open={open}
          autoHideDuration={current?.severity === "error" ? 6000 : 3500}
          onClose={(_, reason) => reason !== "clickaway" && setOpen(false)}
          slotProps={{ transition: { onExited: () => setCurrent(null) } }}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert variant="filled" severity={current?.severity ?? "info"} onClose={() => setOpen(false)}>
            {current?.message}
          </Alert>
        </Snackbar>

        <Dialog open={Boolean(dialog)} onClose={() => closeDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{shownDialog?.title}</DialogTitle>
          {shownDialog?.description && (
            <DialogContent>
              <DialogContentText>{shownDialog.description}</DialogContentText>
            </DialogContent>
          )}
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button color="inherit" onClick={() => closeDialog(false)}>
              {shownDialog?.cancelText ?? t("actions.cancel")}
            </Button>
            <Button
              variant="contained"
              color={shownDialog?.danger ? "error" : "primary"}
              onClick={() => closeDialog(true)}
              autoFocus
            >
              {shownDialog?.confirmText ?? (shownDialog?.danger ? t("actions.delete") : t("actions.confirm"))}
            </Button>
          </DialogActions>
        </Dialog>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
