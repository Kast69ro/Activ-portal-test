import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import { navSections } from "@/config/brand";
import { features } from "@/features";
import { getDisplayName, hasAnyRole, selectRoles, selectUser } from "@/shared/model/auth";
import { LogoMark } from "@/shared/ui";

export default function HomePage() {
  const { t } = useTranslation("home");
  const user = useSelector(selectUser);
  const roles = useSelector(selectRoles);

  // Плитки — все доступные пользователю разделы меню, кроме самой главной
  const tiles = features.filter((f) => f.section && f.id !== "home" && hasAnyRole(roles, f.roles));
  const bySection = navSections
    .map((section) => ({ section, items: tiles.filter((f) => f.section === section) }))
    .filter((g) => g.items.length);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[28px] bg-linear-to-br from-brand-600 via-brand-700 to-brand-900 px-12 py-14 text-white shadow-xl shadow-brand-900/20">
        <LogoMark className="absolute -top-10 -right-6 size-80 opacity-10 brightness-0 invert" />
        <div className="relative max-w-2xl">
          <p className="text-lg text-white/80">{t("greeting")}</p>
          <h1 className="mt-1 text-5xl font-extrabold tracking-tight">{getDisplayName(user)}</h1>
          <p className="mt-3 text-2xl font-semibold text-white/90">{t("subtitle")}</p>
          <p className="mt-8 text-xs font-bold tracking-[0.25em] text-white/60 uppercase">{t("motto")}</p>
        </div>
      </section>

      {bySection.map(({ section, items }) => (
        <section key={section}>
          <h2 className="mb-4 text-sm font-bold tracking-wider text-fg-muted uppercase">
            {t(`common:nav.${section}`)}
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {items.map((f) => (
              <Card
                key={f.id}
                sx={{ transition: "all .2s", "&:hover": { borderColor: "primary.light", boxShadow: 4 } }}
              >
                <CardActionArea component={Link} to={f.path} sx={{ p: 2.5 }}>
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                      <f.icon className="size-5" />
                    </span>
                    <ArrowRight className="size-4 text-fg-muted" />
                  </div>
                  <div className="mt-4 font-bold">{t(f.titleKey, { ns: f.ns })}</div>
                </CardActionArea>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
