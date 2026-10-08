/**
 * Боковое меню. Пункты строятся из реестра фич (src/features) с учётом ролей пользователя,
 * разделы и их порядок — из config/brand.js.
 * Развёрнутое: разделы-аккордеоны (раскрытые запоминаются в браузере). Свёрнутое: только иконки.
 */
import { useEffect, useRef, useState } from "react";
import { NavLink, matchPath, useLocation } from "react-router";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { navSections } from "@/config/brand";
import { features } from "@/features";
import { cn } from "@/shared/lib/cn";
import { hasAnyRole, selectRoles } from "@/shared/model/auth";
import { selectSidebarCollapsed, toggleSidebar } from "@/shared/model/settings";
import { Logo, LogoMark } from "@/shared/ui";
import { RatesWidget } from "./RatesWidget";

/** Раскрытые разделы меню — удобство одного браузера, поэтому просто localStorage */
const OPEN_SECTIONS_KEY = "activbank-nav-open";

function readOpenSections() {
  try {
    const saved = JSON.parse(localStorage.getItem(OPEN_SECTIONS_KEY));
    return Array.isArray(saved) ? saved : navSections;
  } catch {
    return navSections;
  }
}

/** Пункт относится к текущей странице — с учётом вложенных адресов (/test → /test/run) */
const isActivePath = (path, pathname) =>
  path === "/" ? pathname === "/" : Boolean(matchPath({ path, end: false }, pathname));

export function Sidebar() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const collapsed = useSelector(selectSidebarCollapsed);
  const roles = useSelector(selectRoles);
  const [openSections, setOpenSections] = useState(readOpenSections);

  const visible = features.filter((f) => f.section && !f.public && hasAnyRole(roles, f.roles));
  const groups = navSections
    .map((section) => ({ section, items: visible.filter((f) => f.section === section) }))
    .filter((g) => g.items.length);
  const activeSection = groups.find((g) => g.items.some((f) => isActivePath(f.path, pathname)))?.section;

  const saveOpenSections = (next) => {
    setOpenSections(next);
    try {
      localStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(next));
    } catch {
      /* localStorage недоступен */
    }
  };

  // Перешли в другой раздел (с главной, по ссылке), а он свёрнут — раскрываем.
  // При первой загрузке не трогаем: раздел мог свернуть сам пользователь.
  const prevSection = useRef(activeSection);
  useEffect(() => {
    if (activeSection === prevSection.current) return;
    prevSection.current = activeSection;
    if (activeSection && !openSections.includes(activeSection)) saveOpenSections([...openSections, activeSection]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- реагируем только на смену раздела
  }, [activeSection]);

  const toggleSection = (section) =>
    saveOpenSections(
      openSections.includes(section) ? openSections.filter((s) => s !== section) : [...openSections, section],
    );

  const toggleButton = (
    <Tooltip title={t(collapsed ? "nav.expand" : "nav.collapse")} placement="right">
      <IconButton onClick={() => dispatch(toggleSidebar())} size="small" aria-label={t(collapsed ? "nav.expand" : "nav.collapse")}>
        {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
      </IconButton>
    </Tooltip>
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-card transition-[width] duration-200",
        collapsed ? "w-20" : "w-66",
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center" : "justify-between px-4")}>
        {collapsed ? (
          <span className="grid size-11 place-items-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
            <LogoMark className="size-7" />
          </span>
        ) : (
          <>
            <Logo />
            {toggleButton}
          </>
        )}
      </div>

      {collapsed ? (
        <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-3">
          {groups.map(({ section, items }, i) => (
            <div key={section} className="flex flex-col items-center gap-1">
              {i > 0 && <div className="my-2 h-px w-8 bg-line" />}
              {items.map((f) => (
                <CompactNavItem key={f.id} feature={f} />
              ))}
            </div>
          ))}
        </nav>
      ) : (
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {groups.map(({ section, items }) => {
            const open = openSections.includes(section);
            return (
              <Accordion
                key={section}
                expanded={open}
                onChange={() => toggleSection(section)}
                disableGutters
                elevation={0}
                square
                sx={{ bgcolor: "transparent", "&::before": { display: "none" } }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown className="size-4" />}
                  sx={{
                    minHeight: 32,
                    px: 1.5,
                    borderRadius: 2,
                    "&:hover": { bgcolor: "action.hover" },
                    "& .MuiAccordionSummary-content": { my: 0.75, alignItems: "center", gap: 1 },
                  }}
                >
                  <span className="text-[11px] font-bold tracking-wider text-fg-muted/80 uppercase">
                    {t(`nav.${section}`)}
                  </span>
                  {!open && activeSection === section && <span className="size-1.5 rounded-full bg-brand-600" />}
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, pb: 1 }}>
                  <ul className="space-y-0.5">
                    {items.map((f) => (
                      <li key={f.id}>
                        <NavItem feature={f} />
                      </li>
                    ))}
                  </ul>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </nav>
      )}

      <div className={cn("shrink-0 p-3", collapsed && "flex justify-center border-t border-line")}>
        {collapsed ? toggleButton : <RatesWidget collapsed={false} />}
      </div>
    </aside>
  );
}

/** Пункт развёрнутого меню: иконка и название */
function NavItem({ feature: f }) {
  const { t } = useTranslation();
  const Icon = f.icon;

  return (
    <NavLink
      to={f.path}
      end={f.path === "/"}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
          isActive
            ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
            : "text-fg-muted hover:bg-muted hover:text-fg",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-brand-600" />}
          {Icon && <Icon className="size-4.5 shrink-0" strokeWidth={isActive ? 2.4 : 2} />}
          <span className="flex-1 truncate">{t(f.titleKey, { ns: f.ns })}</span>
        </>
      )}
    </NavLink>
  );
}

/**
 * Пункт свёрнутого меню: квадратная кнопка с иконкой и подсказкой.
 * Tooltip оборачивает span, а не NavLink: Tooltip склеивает className ребёнка как строку
 * и терял функцию className у NavLink — у иконок пропадали отступы и подсветка.
 */
function CompactNavItem({ feature: f }) {
  const { t } = useTranslation();
  const Icon = f.icon;

  return (
    <Tooltip title={t(f.titleKey, { ns: f.ns })} placement="right">
      <span className="block">
        <NavLink
          to={f.path}
          end={f.path === "/"}
          aria-label={t(f.titleKey, { ns: f.ns })}
          className={({ isActive }) =>
            cn(
              "relative grid size-11 place-items-center rounded-xl transition-colors",
              isActive
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                : "text-fg-muted hover:bg-muted hover:text-fg",
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute top-2.5 bottom-2.5 -left-4.5 w-1 rounded-r-full bg-brand-600" />}
              {Icon && <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />}
            </>
          )}
        </NavLink>
      </span>
    </Tooltip>
  );
}
