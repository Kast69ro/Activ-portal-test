import { useTranslation } from "react-i18next";
import Card from "@mui/material/Card";
import { LanguageSwitcher, LogoMark } from "@/shared/ui";

/** Фон и карточка для страниц входа и регистрации */
export function AuthLayout({ title, subtitle, children, width = 420 }) {
  const { t } = useTranslation("auth");

  return (
    <div className="grid min-h-dvh grid-cols-[1fr_minmax(520px,1fr)] bg-bg">
      <div className="relative overflow-hidden bg-linear-to-br from-brand-700 via-brand-600 to-brand-900 p-14 text-white">
        <LogoMark className="absolute -right-24 -bottom-24 size-[520px] opacity-10 brightness-0 invert" />
        <div className="relative flex h-full flex-col">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-white">
              <LogoMark className="size-8" />
            </span>
            <span className="text-2xl font-extrabold tracking-tight">{t("common:brand.name")}</span>
          </div>
          <div className="mt-auto max-w-lg">
            <h2 className="text-4xl leading-tight font-extrabold">{t("hero.title")}</h2>
            <p className="mt-4 text-lg text-white/80">{t("hero.text")}</p>
          </div>
        </div>
      </div>

      <div className="relative grid place-items-center p-10">
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>
        <Card sx={{ width, p: 4.5 }}>
          <div className="flex flex-col items-center">
            <LogoMark className="size-14" />
            <span className="mt-2 text-sm font-extrabold tracking-[0.2em] text-brand-600 uppercase">
              {t("common:brand.name")}
            </span>
          </div>
          <h1 className="mt-6 text-center text-2xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1 text-center text-fg-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </Card>
      </div>
    </div>
  );
}
