/**
 * Домен auth: регистрация публичных страниц /login и /register.
 */
import { lazy } from "react";

export default [
  {
    id: "login",
    path: "/login",
    public: true,
    section: null,
    titleKey: "login.title",
    page: lazy(() => import("./LoginPage")),
  },
  {
    // Ссылка на регистрацию скрыта, как и в прежней системе: учётные записи создаёт HR
    id: "register",
    path: "/register",
    public: true,
    section: null,
    titleKey: "register.title",
    page: lazy(() => import("./RegisterPage")),
  },
];
