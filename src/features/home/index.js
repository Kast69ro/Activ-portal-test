/**
 * Домен home: регистрация главной страницы /.
 */
import { lazy } from "react";
import { House } from "lucide-react";

export default {
  id: "home",
  path: "/",
  icon: House,
  section: "main",
  order: 0,
  page: lazy(() => import("./HomePage")),
};
