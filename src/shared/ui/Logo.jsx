import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";

/** Знак «А» Активбанка — векторная копия официального логотипа (src/shared/assets/logo.png) */
export function LogoMark({ className }) {
  return (
    <svg viewBox="372 322 336 318" className={cn("shrink-0", className)} aria-hidden>
      <path fill="#e31e24" d="M510 330h60l-83 197c-30 9-58 26-80 48z" />
      <path fill="#e31e24" d="m577 347 120 284h-61l-89-213z" />
      <path fill="#e31e24" d="M383 631c33-68 105-112 202-95l29 70c-49-38-126-37-172 25z" />
    </svg>
  );
}

export function Logo({ collapsed = false, className }) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
        <LogoMark className="size-7" />
      </span>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <div className="text-[17px] font-extrabold tracking-tight text-brand-600">{t("brand.name")}</div>
          <div className="truncate text-[11px] font-medium text-fg-muted">{t("brand.product")}</div>
        </div>
      )}
    </div>
  );
}
