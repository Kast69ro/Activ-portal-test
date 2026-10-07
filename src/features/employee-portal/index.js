/**
 * Домен employee-portal: регистрация страниц /select-employee и /employee/:id/dashboard (на весь экран).
 */
import { lazy } from "react";

/**
 * Кабинет сотрудника: выбор профиля и его материалы.
 * В прежней системе эти страницы открывались без входа; здесь — только после входа,
 * потому что они показывают список сотрудников банка.
 */
export default [
  {
    id: "employee-select",
    path: "/select-employee",
    section: null,
    layout: "blank",
    page: lazy(() => import("./SelectEmployeePage")),
  },
  {
    id: "employee-dashboard",
    path: "/employee/:id/dashboard",
    section: null,
    layout: "blank",
    titleKey: "dashboard.title",
    page: lazy(() => import("./EmployeeDashboardPage")),
  },
];
