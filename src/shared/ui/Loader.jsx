import CircularProgress from "@mui/material/CircularProgress";
import { cn } from "@/shared/lib/cn";

/** Индикатор загрузки по центру блока */
export function Loader({ className }) {
  return (
    <div className={cn("grid min-h-60 place-items-center", className)}>
      <CircularProgress size={32} />
    </div>
  );
}
