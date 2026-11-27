/**
 * Чип типа вопроса (выбор / открытый / рейтинг). Используется на большинстве страниц testing.
 */
import { CheckCircle2, PenLine, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import Chip from "@mui/material/Chip";
import { QUESTION_TYPE, QUESTION_TYPE_KEY, questionType } from "@/entities/testing/model";

const STYLE = {
  [QUESTION_TYPE.CHOICE]: { color: "success", icon: CheckCircle2 },
  [QUESTION_TYPE.OPEN]: { color: "secondary", icon: PenLine },
  [QUESTION_TYPE.RATING]: { color: "warning", icon: Star },
};

export function QuestionTypeChip({ type }) {
  const { t } = useTranslation();
  const n = questionType(type);
  const { color, icon: Icon } = STYLE[n];
  return (
    <Chip
      size="small"
      variant="outlined"
      color={color}
      icon={<Icon className="size-3.5" />}
      label={t(`questionType.${QUESTION_TYPE_KEY[n]}`)}
    />
  );
}
