import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { cn } from "@/shared/lib/cn";
import { selectSidebarCollapsed } from "@/shared/model/settings";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const { pathname } = useLocation();
  const collapsed = useSelector(selectSidebarCollapsed);

  // Прокручиваем наверх при смене страницы
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={cn("min-h-dvh transition-[padding] duration-200", collapsed ? "pl-20" : "pl-66")}>
      <Sidebar />
      <Topbar />
      <main className="mx-auto max-w-360 px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
