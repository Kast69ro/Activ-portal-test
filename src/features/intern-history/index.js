import { lazy } from "react";
import { History } from "lucide-react";

/** История стажёров: попытки прохождения тестов по одноразовым ссылкам (сервис стажёров) */
export default {
  id: "intern-history",
  path: "/test-history",
  icon: History,
  section: "testing",
  order: 50,
  roles: ["admin"],
  page: lazy(() => import("./InternsPage")),
  children: [
    { path: "intern/:internId", page: lazy(() => import("./InternPage")) },
    { path: "attempt/:attemptId", page: lazy(() => import("./AttemptPage")) },
  ],
};
