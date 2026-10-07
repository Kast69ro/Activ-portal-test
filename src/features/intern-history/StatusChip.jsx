import { useTranslation } from "react-i18next";
import Chip from "@mui/material/Chip";

/** Статус попытки: проверено / ждёт проверки */
export function StatusChip({ needsGrading }) {
  const { t } = useTranslation("intern-history");
  return (
    <Chip
      size="small"
      variant="outlined"
      color={needsGrading ? "warning" : "success"}
      label={t(needsGrading ? "status.needsGrading" : "status.graded")}
    />
  );
}

/** Оценка ответа: 1 — верно, 0 — неверно, иначе — не проверен */
export function ScoreChip({ score }) {
  const { t } = useTranslation("intern-history");
  if (score === 1) return <Chip size="small" color="success" label={t("score.right")} />;
  if (score === 0) return <Chip size="small" color="error" label={t("score.wrong")} />;
  return <Chip size="small" color="warning" label={t("score.pending")} />;
}
