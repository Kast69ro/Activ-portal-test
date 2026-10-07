import Card from "@mui/material/Card";
import { cn } from "@/shared/lib/cn";

const TONES = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
};

/** Плитка с показателем: подпись, значение, иконка */
export function StatCard({ label, value, icon: Icon, tone = "brand", hint }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-fg-muted">{label}</span>
        {Icon && (
          <span className={cn("grid size-9 place-items-center rounded-xl", TONES[tone])}>
            <Icon className="size-4.5" />
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-extrabold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-fg-muted">{hint}</div>}
    </Card>
  );
}
