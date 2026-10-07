/**
 * Используется только в TestsPage.
 */
import { useEffect, useState } from "react";
import { Check, Copy, Hourglass, Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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
import { MAX_DURATION, PRESET_DURATIONS } from "@/features/testing/model/constants";

/** Одноразовая ссылка на тест для стажёра (сервис стажёров) */
export function LinkDialog({ test, onClose }) {
  const { t, i18n } = useTranslation("testing");
  const toast = useToast();
  const [duration, setDuration] = useState(5);
  const [copied, setCopied] = useState(false);
  const [generate, { data: link, isLoading, error, reset }] = useGenerateTestLinkMutation();

  useEffect(() => {
    if (test) {
      setDuration(5);
      setCopied(false);
      reset();
    }
  }, [test, reset]);

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
    <Dialog open={Boolean(test)} onClose={onClose} maxWidth="sm" fullWidth>
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

        {link ? (
          <TextField
            label={t("link.result")}
            value={link}
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
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
        ) : (
          <Button
            variant="contained"
            loading={isLoading}
            onClick={() => generate({ testId: test.id, durationMinutes: duration })}
          >
            {t("link.generate")}
          </Button>
        )}
        {error && <Alert severity="error">{getErrorMessage(error, t("link.failed"))}</Alert>}
        {link && <Alert severity="info">{t("link.oneTime")}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>{t("common:actions.close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
