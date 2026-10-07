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
    page: lazy(() => import("./ArticlesPage")),
    children: [{ path: ":id", page: lazy(() => import("./ArticlePage")) }],
  },
  {
    id: "my-articles",
    path: "/my-articles",
    icon: Newspaper,
    section: null,
    order: 30,
    titleKey: "mine.title",
    page: lazy(() => import("./MyArticlesPage")),
  },
];
