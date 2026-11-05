/**
 * Каркас обычных страниц: боковое меню, шапка и область контента (Outlet).
 * Подключается в src/app/router.jsx для всех страниц с layout: "app".
 */
import { useEffect } from "react";
import { Outlet, useLocation, useMatches } from "react-router";
import { useSelector } from "react-redux";
import { cn } from "@/shared/lib/cn";
import { selectSidebarCollapsed } from "@/shared/model/settings";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const { pathname } = useLocation();
  const collapsed = useSelector(selectSidebarCollapsed);
  // Широкие страницы (wide: true в реестре фич) — без ограничения ширины и с узкими полями
  const wide = useMatches().findLast((m) => m.handle?.feature)?.handle.feature.wide;

  // Прокручиваем наверх при смене страницы
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={cn("min-h-dvh transition-[padding] duration-200", collapsed ? "pl-20" : "pl-66")}>
      <Sidebar />
      <Topbar />
      <main className={cn("mx-auto", wide ? "px-4 py-5" : "max-w-360 px-8 py-8")}>
        <Outlet />
      </main>
    </div>
  );
}
