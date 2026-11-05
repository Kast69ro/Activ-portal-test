/**
 * Домен knowledge: регистрация страниц /video-lessons, /documentation и /course-catalog.
 */
import { lazy } from "react";
import { BookOpen, FileText, PlayCircle } from "lucide-react";

/** База знаний: читают все, управляют (папки, материалы) — администраторы */
export default [
  {
    id: "video-lessons",
    path: "/video-lessons",
    icon: PlayCircle,
    section: "knowledge",
    order: 10,
    titleKey: "video.title",
    page: lazy(() => import("./pages/VideoLessonsPage/VideoLessonsPage")),
  },
  {
    id: "documentation",
    path: "/documentation",
    icon: FileText,
    section: "knowledge",
    order: 20,
    titleKey: "documentation.title",
    page: lazy(() => import("./pages/DocumentationPage/DocumentationPage")),
  },
  {
    id: "course-catalog",
    path: "/course-catalog",
    icon: BookOpen,
    section: "knowledge",
    order: 30,
    titleKey: "courses.title",
    page: lazy(() => import("./pages/CourseCatalogPage/CourseCatalogPage")),
  },
];
