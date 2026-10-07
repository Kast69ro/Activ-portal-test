import { lazy } from "react";
import { FileText, PlayCircle } from "lucide-react";

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
];
