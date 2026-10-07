/**
 * Защита маршрутов: RequireAuth — только после входа, RequireRole — по ролям из описания страницы фичи.
 * Используются в src/app/router.jsx.
 */
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { hasAnyRole, selectIsAuthenticated, selectRoles } from "@/shared/model/auth";

/** Без входа — на страницу логина, запомнив, куда хотели попасть */
export function RequireAuth({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/** Страница только для указанных ролей */
export function RequireRole({ roles, children }) {
  const userRoles = useSelector(selectRoles);
  return hasAnyRole(userRoles, roles) ? children : <ForbiddenPage />;
}
