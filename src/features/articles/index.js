import { lazy } from "react";
import { Newspaper } from "lucide-react";

/**
 * Статьи и новости. В прежней системе пункты меню были закомментированы, но страницы работали —
 * здесь так же: section: null. Чтобы показать в меню, поставьте section: "communication".
 */
export default [
  {
    id: "articles",
    path: "/article",
    icon: Newspaper,
    section: null,
    order: 20,
    page: lazy(() => import("./pages/ArticlesPage/ArticlesPage")),
    children: [{ path: ":id", page: lazy(() => import("./pages/ArticlePage/ArticlePage")) }],
  },
  {
    id: "my-articles",
    path: "/my-articles",
    icon: Newspaper,
    section: null,
    order: 30,
    titleKey: "mine.title",
    page: lazy(() => import("./pages/MyArticlesPage/MyArticlesPage")),
  },
];
