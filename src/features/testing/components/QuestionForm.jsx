import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { QUESTION_TYPE, apiQuestionType, correctAnswer, questionType } from "@/entities/testing/model";
import { RatingPicker } from "./RatingPicker";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const MAX_OPTIONS = 6;

/**
 * Форма вопроса.
 * mode="test"   — у варианта выбора отмечается правильный ответ, у рейтинга — ожидаемая оценка;
 * mode="survey" — правильных ответов нет (опрос).
 * Текст на таджикском необязателен: если пусто, берётся русский.
 */
export function QuestionForm({ mode = "test", initial, submitLabel, loading, onSubmit }) {
  const { t, i18n } = useTranslation("testing");
  const isSurvey = mode === "survey";
  const lang = i18n.language;

  const [contentRu, setContentRu] = useState("");
  const [contentTj, setContentTj] = useState("");
  const [type, setType] = useState(QUESTION_TYPE.CHOICE);
  const [options, setOptions] = useState([]);
  const [reference, setReference] = useState("");
  const [rating, setRating] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = initial;
    setContentRu(q?.contentRu ?? "");
    setContentTj(q?.contentTj && q.contentTj !== q.contentRu ? q.contentTj : "");
    setType(q ? questionType(q.type) : QUESTION_TYPE.CHOICE);
    setOptions(
      q && questionType(q.type) === QUESTION_TYPE.CHOICE
        ? q.options.map((o) => ({
            text: lang === "tj" ? o.textTj || o.textRu : o.textRu || o.textTj,
            isCorrect: o.isCorrect,
          }))
        : [],
    );
    const ref = q ? correctAnswer(q) : null;
    setReference(q && questionType(q.type) === QUESTION_TYPE.OPEN ? (ref?.textRu ?? "") : "");
    setRating(q?.optionId ?? null);
    setError("");
  }, [initial, lang]);

  const changeType = (value) => {
    setType(value);
    setOptions(
      value === QUESTION_TYPE.CHOICE
        ? [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ]
        : [],
    );
    setReference("");
    setRating(null);
    setError("");
  };

  const updateOption = (index, patch) =>
    setOptions((list) =>
      list.map((o, i) => (i === index ? { ...o, ...patch } : patch.isCorrect ? { ...o, isCorrect: false } : o)),
    );

  const validate = () => {
    if (!contentRu.trim()) return t("question.errors.text");
    if (type === QUESTION_TYPE.CHOICE) {
      if (options.length === 0) return t("question.errors.noOptions");
      if (options.some((o) => !o.text.trim())) return t("question.errors.emptyOption");
      if (!isSurvey && !options.some((o) => o.isCorrect)) return t("question.errors.noCorrect");
    }
    if (type === QUESTION_TYPE.RATING && !isSurvey && !rating) return t("question.errors.noRating");
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    const message = validate();
    setError(message);
    if (message) return;

    const ru = contentRu.trim();
    const payload = { contentRu: ru, contentTj: contentTj.trim() || ru, type: apiQuestionType(type) };

    if (type === QUESTION_TYPE.CHOICE) {
      payload.options = options.map((o, i) => ({
        textRu: o.text.trim(),
        textTj: o.text.trim(),
        // В опросе правильного ответа нет; прежняя система помечала первый вариант — сохраняем совместимость
        isCorrect: isSurvey ? i === 0 : Boolean(o.isCorrect),
      }));
    } else if (type === QUESTION_TYPE.OPEN) {
      payload.options = reference.trim()
        ? [{ textRu: reference.trim(), textTj: reference.trim(), isCorrect: true }]
        : [];
    } else {
      payload.options = [];
      if (!isSurvey) payload.optionId = rating;
    }
    if (isSurvey) payload.isSurvey = type !== QUESTION_TYPE.CHOICE;

    const ok = await onSubmit(payload);
    if (ok && !initial) {
      setContentRu("");
      setContentTj("");
      changeType(QUESTION_TYPE.CHOICE);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <TextField
        label={t("question.textRu")}
        required
        multiline
        minRows={2}
        value={contentRu}
        onChange={(e) => setContentRu(e.target.value)}
      />
      <TextField
        label={t("question.textTj")}
        helperText={t("question.textTjHint")}
        multiline
        minRows={2}
        value={contentTj}
        onChange={(e) => setContentTj(e.target.value)}
      />

      <div>
        <div className="mb-1 text-sm font-semibold text-fg-muted">{t("question.type")}</div>
        <RadioGroup row value={type} onChange={(e) => changeType(Number(e.target.value))}>
          <FormControlLabel value={QUESTION_TYPE.CHOICE} control={<Radio />} label={t("common:questionType.choice")} />
          <FormControlLabel value={QUESTION_TYPE.OPEN} control={<Radio />} label={t("common:questionType.open")} />
          <FormControlLabel value={QUESTION_TYPE.RATING} control={<Radio />} label={t("common:questionType.rating")} />
        </RadioGroup>
      </div>

      {type === QUESTION_TYPE.CHOICE && (
        <div className="grid gap-2">
          {!isSurvey && <div className="text-xs text-fg-muted">{t("question.markCorrect")}</div>}
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              {isSurvey ? (
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold">
                  {LETTERS[i]}
                </span>
              ) : (
                <Tooltip title={t("question.correct")}>
                  <Radio checked={o.isCorrect} onChange={() => updateOption(i, { isCorrect: true })} />
                </Tooltip>
              )}
              <TextField
                fullWidth
                placeholder={`${t("question.option")} ${LETTERS[i]}`}
                value={o.text}
                onChange={(e) => updateOption(i, { text: e.target.value })}
              />
              <IconButton onClick={() => setOptions((list) => list.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          ))}
          {options.length < MAX_OPTIONS && (
            <Button
              variant="outlined"
              sx={{ borderStyle: "dashed" }}
              startIcon={<Plus className="size-4" />}
              onClick={() => setOptions((list) => [...list, { text: "", isCorrect: false }])}
            >
              {t("question.addOption")}
            </Button>
          )}
        </div>
      )}

      {type === QUESTION_TYPE.OPEN && (
        <TextField
          label={t("question.reference")}
          helperText={t("question.referenceHint")}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      )}

      {type === QUESTION_TYPE.RATING &&
        (isSurvey ? (
          <Alert severity="info">{t("question.ratingSurveyHint")}</Alert>
        ) : (
          <div>
            <div className="mb-2 text-sm font-semibold text-fg-muted">{t("question.expectedRating")}</div>
            <RatingPicker value={rating} onChange={setRating} />
          </div>
        ))}

      {error && <Alert severity="warning">{error}</Alert>}

      <Button type="submit" variant="contained" loading={loading}>
        {submitLabel ?? t("question.create")}
      </Button>
    </form>
  );
}
