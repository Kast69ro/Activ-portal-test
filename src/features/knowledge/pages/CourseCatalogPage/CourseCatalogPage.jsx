/**
 * Каталог курсов — карточки внешних образовательных платформ (открываются в новой вкладке).
 * Маршрут: /course-catalog. Доступ: все вошедшие.
 */
import { useTranslation } from "react-i18next";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import { ArrowUpRight, BookOpen, GraduationCap } from "lucide-react";
import lerna from "@/features/knowledge/assets/lerna.png";
import osbp from "@/features/knowledge/assets/osbp.png";

/** Платформы. Тексты — в переводах: courses.items.<id> */
const COURSES = [
  { id: "osbp", name: "OSBP", image: osbp, url: "https://www.osbp-ca.org/", accent: "#ff4d4f" },
  { id: "lerna", name: "Lerna", image: lerna, url: "https://www.lerna.tj/courses/", accent: "#8b5cf6" },
];

export default function CourseCatalogPage() {
  const { t } = useTranslation("knowledge");

  return (
    // Ровно на экран без прокрутки: 100dvh минус шапка (65px) и отступы main (2 × 32px)
    <section className="mx-auto flex h-[calc(100dvh-129px)] max-w-6xl flex-col justify-center overflow-hidden">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-semibold tracking-wide text-brand-600 uppercase shadow-sm dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-400">
          <GraduationCap className="size-4.5" />
          {t("courses.badge")}
        </span>
        <h1 className="mt-4 text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight">{t("courses.heading")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-fg-muted">{t("courses.subtitle")}</p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-7 md:grid-cols-2">
        {COURSES.map((course) => (
          <Card
            key={course.id}
            className="group"
            sx={{
              borderRadius: 6,
              transition: "all .3s",
              "&:hover": { transform: "translateY(-8px)", boxShadow: "0 20px 50px rgba(0,0,0,.10)" },
            }}
          >
            <CardActionArea
              component="a"
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("courses.goTo", { name: course.name })}
              sx={{ height: "100%" }}
            >
              <div className="relative flex h-[clamp(150px,28vh,264px)] items-center justify-center overflow-hidden bg-linear-to-br from-gray-50 to-white p-8">
                <div
                  className="absolute -top-16 -right-16 size-48 rounded-full opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-150"
                  style={{ backgroundColor: course.accent }}
                />
                <span
                  className="absolute top-5 left-5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ color: course.accent, backgroundColor: `${course.accent}14` }}
                >
                  {t(`courses.items.${course.id}.tag`)}
                </span>
                <img
                  src={course.image}
                  alt={course.name}
                  loading="lazy"
                  className="relative max-h-36 w-4/5 object-contain transition-transform duration-500 group-hover:scale-110"
                />
                <span
                  className="absolute right-5 bottom-5 grid size-10 place-items-center rounded-full text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ backgroundColor: course.accent }}
                >
                  <ArrowUpRight className="size-5" />
                </span>
              </div>

              <div className="p-6">
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-2xl"
                    style={{ color: course.accent, backgroundColor: `${course.accent}14` }}
                  >
                    <BookOpen className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-2xl font-bold">{course.name}</div>
                    <div className="truncate text-sm text-fg-muted">{t(`courses.items.${course.id}.subtitle`)}</div>
                  </div>
                </div>

                <p className="mb-4 min-h-12 text-sm leading-6 text-fg-muted">
                  {t(`courses.items.${course.id}.description`)}
                </p>

                <div
                  className="flex items-center justify-between border-t border-line pt-4 font-semibold"
                  style={{ color: course.accent }}
                >
                  <span>{t("courses.open")}</span>
                  <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </div>
            </CardActionArea>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-fg-muted">{t("courses.footer")}</p>
    </section>
  );
}
