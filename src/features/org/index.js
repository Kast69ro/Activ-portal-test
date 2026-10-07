import { lazy } from "react";
import { Building2, IdCard, Network, Users } from "lucide-react";

/** Администрирование оргструктуры — только для Admin / SuperAdmin */
const admin = { section: "administration", roles: ["admin"] };

export default [
  {
    ...admin,
    id: "departments",
    path: "/department",
    icon: Building2,
    order: 10,
    titleKey: "departments.title",
    page: lazy(() => import("./DepartmentsPage")),
  },
  {
    ...admin,
    id: "subdepartments",
    path: "/subdepartment",
    icon: Network,
    order: 20,
    titleKey: "subdepartments.title",
    page: lazy(() => import("./SubDepartmentsPage")),
  },
  {
    ...admin,
    id: "positions",
    path: "/position",
    icon: IdCard,
    order: 30,
    titleKey: "positions.title",
    page: lazy(() => import("./PositionsPage")),
  },
  {
    ...admin,
    id: "employees",
    path: "/employee",
    icon: Users,
    order: 40,
    titleKey: "employees.title",
    page: lazy(() => import("./EmployeesPage")),
  },
];
