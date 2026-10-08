/**
 * Домен atm: регистрация страниц мониторинга /atm и выписки /atm/:id/report (только Admin).
 */
import { lazy } from "react";
import { Banknote } from "lucide-react";

export default {
  id: "atms",
  path: "/atm",
  icon: Banknote,
  section: "monitoring",
  order: 10,
  roles: ["admin"],
  page: lazy(() => import("./pages/AtmsPage/AtmsPage")),
  children: [{ path: ":id/report", page: lazy(() => import("./pages/AtmReportPage/AtmReportPage")) }],
};
