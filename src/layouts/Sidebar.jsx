import { NavLink } from "react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { navSections } from "@/config/brand";
import { features } from "@/features";
import { cn } from "@/shared/lib/cn";
import { hasAnyRole, selectRoles } from "@/shared/model/auth";
import { selectSidebarCollapsed, toggleSidebar } from "@/shared/model/settings";
import { Logo } from "@/shared/ui";
import { RatesWidget } from "./RatesWidget";

export function Sidebar() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);
  const roles = useSelector(selectRoles);

  const visible = features.filter((f) => f.section && !f.public && hasAnyRole(roles, f.roles));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-card transition-[width] duration-200",
        collapsed ? "w-20" : "w-66",
      )}
    >
      <div className={cn("flex h-16 items-center", collapsed ? "justify-center" : "justify-between px-4")}>
        {!collapsed && <Logo />}
        <Tooltip title={t(collapsed ? "nav.expand" : "nav.collapse")} placement="right">
          <IconButton onClick={() => dispatch(toggleSidebar())} size="small">
            {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </IconButton>
        </Tooltip>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {navSections.map((section) => {
          const items = visible.filter((f) => f.section === section);
          if (!items.length) return null;
          return (
            <div key={section}>
              {collapsed ? (
                <div className="mx-auto mb-2 h-px w-8 bg-line" />
              ) : (
                <div className="mb-2 px-3 text-[11px] font-bold tracking-wider text-fg-muted/80 uppercase">
                  {t(`nav.${section}`)}
                </div>
              )}
              <ul className="space-y-0.5">
                {items.map((f) => (
                  <li key={f.id}>
                    <NavItem feature={f} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="p-3">
        <RatesWidget collapsed={collapsed} />
      </div>
    </aside>
  );
}

function NavItem({ feature: f, collapsed }) {
  const { t } = useTranslation();
  const Icon = f.icon;
  const title = t(f.titleKey, { ns: f.ns });

  const link = (
    <NavLink
      to={f.path}
      end={f.path === "/"}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold transition-colors",
          collapsed ? "justify-center px-0" : "px-3",
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
          {!collapsed && <span className="flex-1 truncate">{title}</span>}
        </>
      )}
    </NavLink>
  );

  return collapsed ? (
    <Tooltip title={title} placement="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
