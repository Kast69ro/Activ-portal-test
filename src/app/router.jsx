/**
 * Роутер приложения. Маршруты строятся из реестра src/features/index.js и делятся на три группы:
 * публичные (вход), "blank" (на весь экран) и обычные — внутри AppLayout с меню и шапкой.
 */
import { Suspense } from "react";
import { createBrowserRouter } from "react-router";
import { features } from "@/features";
import { AppLayout } from "@/layouts/AppLayout";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { Loader } from "@/shared/ui";
import { RequireAuth, RequireRole } from "./guards";

const lazyPage = (Page, feature) => (
  <RequireRole roles={feature.roles}>
    <Suspense fallback={<Loader className="min-h-[60vh]" />}>
      <Page />
    </Suspense>
  </RequireRole>
);

/** Роуты строятся из реестра фич — см. src/features/index.js */
const toRoutes = (list) =>
  list.flatMap((f) => [
    { path: f.path, element: lazyPage(f.page, f), handle: { feature: f } },
    ...(f.children ?? []).map((child) => ({
      path: `${f.path}/${child.path}`.replace(/\/+/g, "/"),
      element: lazyPage(child.page, f),
      handle: { feature: f },
    })),
  ]);

const publicRoutes = toRoutes(features.filter((f) => f.public));
const blankRoutes = toRoutes(features.filter((f) => !f.public && f.layout === "blank"));
const appRoutes = toRoutes(features.filter((f) => !f.public && f.layout !== "blank"));

export const router = createBrowserRouter([
  ...publicRoutes,
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [...appRoutes, { path: "*", element: <NotFoundPage /> }],
  },
  ...blankRoutes.map((route) => ({ ...route, element: <RequireAuth>{route.element}</RequireAuth> })),
]);
