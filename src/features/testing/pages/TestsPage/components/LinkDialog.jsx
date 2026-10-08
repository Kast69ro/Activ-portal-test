/**
 * Используется только в TestsPage.
 */
import { useState } from "react";
import { Check, Copy, Hourglass, Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useGenerateTestLinkMutation } from "@/entities/interns/internsApi";
import { testTitle } from "@/entities/testing/model";
import { getErrorMessage } from "@/shared/api/normalize";
import { useToast } from "@/shared/ui";
import { useRetained } from "@/shared/lib/useRetained";
import { MAX_DURATION, PRESET_DURATIONS } from "@/features/testing/model/constants";

/** Одноразовая ссылка на тест для стажёра (сервис стажёров) */
export function LinkDialog({ test: current, onClose }) {
  // Пока окно закрывается, показываем последний тест — иначе содержимое пропадёт до конца анимации
  const test = useRetained(current);
  const { t, i18n } = useTranslation("testing");
  const toast = useToast();
  const [duration, setDuration] = useState(5);
  const [copied, setCopied] = useState(false);
  const [generate, { data: link, isLoading, isSuccess, error, reset }] = useGenerateTestLinkMutation();
  // Ответ пришёл, но ссылки в нём нет — показываем ошибку, а не молчим
  const emptyResponse = isSuccess && !link;

  // Сбрасываем форму, когда окно полностью закрылось. Раньше сброс был в useEffect с [reset] в зависимостях,
  // но reset из RTK Query меняется с каждым запросом — эффект срабатывал сразу после «Сгенерировать»
  // и стирал и ожидание, и пришедшую ссылку.
  const resetForm = () => {
    setDuration(5);
    setCopied(false);
    reset();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t("link.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("link.copyFailed"));
    }
  };

  return (
    <Dialog
      open={Boolean(current)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ transition: { onExited: resetForm } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Link2 className="size-5 text-brand-600" />
        {t("link.title")}
      </DialogTitle>
      <DialogContent className="grid gap-4" sx={{ pt: "8px !important" }}>
        {test && <div className="font-semibold">{testTitle(test, i18n.language)}</div>}
        <div>
          <TextField
            label={t("start.duration")}
            type="number"
            fullWidth
            value={duration}
            disabled={Boolean(link) || isLoading}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n > 0 && n <= MAX_DURATION) setDuration(n);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Hourglass className="size-4" />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">{t("start.min")}</InputAdornment>,
              },
            }}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESET_DURATIONS.map((m) => (
              <Chip
                key={m}
                size="small"
                label={m}
                disabled={Boolean(link) || isLoading}
                color={duration === m ? "primary" : "default"}
                variant={duration === m ? "filled" : "outlined"}
                onClick={() => setDuration(m)}
              />
            ))}
          </div>
        </div>

        {/* Поле видно всегда: до генерации — подсказка, во время запроса — ожидание, после — ссылка */}
        <TextField
          label={t("link.result")}
          value={link || ""}
          placeholder={isLoading ? t("link.generating") : t("link.placeholder")}
          fullWidth
          onFocus={(e) => link && e.target.select()}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  {isLoading ? <CircularProgress size={16} /> : <Link2 className="size-4" />}
                </InputAdornment>
              ),
              endAdornment: link && (
                <InputAdornment position="end">
                  <Tooltip title={t("link.copy")}>
                    <IconButton onClick={copy}>
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            },
          }}
        />
        {!link && (
          <Button
            variant="contained"
            loading={isLoading}
            loadingPosition="start"
            onClick={() => generate({ testId: test.id, durationMinutes: duration })}
          >
            {isLoading ? t("link.generating") : t("link.generate")}
          </Button>
        )}
        {error && <Alert severity="error">{getErrorMessage(error, t("link.failed"))}</Alert>}
        {emptyResponse && <Alert severity="error">{t("link.empty")}</Alert>}
        {link && <Alert severity="info">{t("link.oneTime")}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>{t("common:actions.close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
