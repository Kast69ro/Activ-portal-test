/**
 * Используют QuestionForm, TestRunPage и SurveyTakingDialog.
 */
import { cn } from "@/shared/lib/cn";

/** Выбор оценки от 1 до 10 */
export function RatingPicker({ value, onChange, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={cn(
            "grid size-11 place-items-center rounded-full border text-[15px] font-bold transition",
            value === n
              ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/30"
              : "border-line bg-card hover:border-brand-300 hover:text-brand-600",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
