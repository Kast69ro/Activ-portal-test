/**
 * Выбор периода выписки банкомата. onSubmit({ fromDate, toDate }) — даты «YYYY-MM-DD».
 * Используют AtmsPage (кнопка «Выписка») и AtmReportPage («Изменить период»).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { dayKey, today } from "@/features/atm/model/transactions";

/** Быстрый выбор: сколько дней назад начинается период */
const PRESETS = [
  ["today", 0],
  ["week", 6],
  ["month", 29],
];

const daysAgo = (n) => dayKey(Date.now() - n * 24 * 60 * 60 * 1000);

export function StatementDialog({ open, atmId, initial, onClose, onSubmit }) {
  const { t } = useTranslation("atm");
  const [fromDate, setFromDate] = useState(initial?.fromDate ?? daysAgo(6));
  const [toDate, setToDate] = useState(initial?.toDate ?? today());

  // Пустые даты и «с» позже «по» не отправляем
  const invalid = !fromDate || !toDate || fromDate > toDate;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      // Каждое открытие начинается с переданного периода (или последней недели)
      slotProps={{
        transition: {
          onEnter: () => {
            setFromDate(initial?.fromDate ?? daysAgo(6));
            setToDate(initial?.toDate ?? today());
          },
        },
      }}
    >
      <DialogTitle>
        {t("statement.title")}
        {atmId && <div className="text-sm font-medium text-fg-muted">{t("statement.atm", { id: atmId })}</div>}
      </DialogTitle>
      <DialogContent className="grid gap-4" sx={{ pt: "8px !important" }}>
        <div className="flex gap-1.5">
          {PRESETS.map(([key, days]) => (
            <Chip
              key={key}
              size="small"
              label={t(`statement.presets.${key}`)}
              variant={fromDate === daysAgo(days) && toDate === today() ? "filled" : "outlined"}
              color={fromDate === daysAgo(days) && toDate === today() ? "primary" : "default"}
              onClick={() => {
                setFromDate(daysAgo(days));
                setToDate(today());
              }}
            />
          ))}
        </div>
        <TextField
          label={t("statement.from")}
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: toDate || today() } }}
          fullWidth
        />
        <TextField
          label={t("statement.to")}
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          error={Boolean(fromDate && toDate && fromDate > toDate)}
          helperText={fromDate && toDate && fromDate > toDate ? t("statement.invalid") : " "}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: fromDate, max: today() } }}
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose}>
          {t("common:actions.cancel")}
        </Button>
        <Button variant="contained" disabled={invalid} onClick={() => onSubmit({ fromDate, toDate })}>
          {t("statement.submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
