/**
 * Кабинет сотрудника: его материалы базы знаний и избранное.
 * Маршрут: /employee/:id/dashboard (без меню). Доступ: все вошедшие.
 */
import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CalendarDays, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { announcementFiles, useGetAnnouncementsQuery } from "@/entities/knowledge/knowledgeApi";
import { ALL, employeeName, findById, useGetEmployeesQuery, useGetPositionsQuery } from "@/entities/org/orgApi";
import { cn } from "@/shared/lib/cn";
import { fileUrl } from "@/shared/lib/files";
import { formatDate } from "@/shared/lib/format";
import { EmptyState, FilePreviewDialog, FileTile, Loader, useToast } from "@/shared/ui";

/** Избранное хранится в браузере для каждого профиля — как в прежней системе */
const likesKey = (id) => `likes_employee_${id}`;
const readLikes = (id) => {
  try {
    return JSON.parse(localStorage.getItem(likesKey(id))) ?? {};
  } catch {
    return {};
  }
};

export default function EmployeeDashboardPage() {
  const { t } = useTranslation("employee-portal");
  const { id } = useParams();
  const toast = useToast();
  const { data: employees, isLoading } = useGetEmployeesQuery(ALL);
  const { data: positions } = useGetPositionsQuery(ALL);
  const { data: announcements = [] } = useGetAnnouncementsQuery();
  const [likes, setLikes] = useState(() => readLikes(id));
  const [preview, setPreview] = useState(null);

  const employee = findById(employees?.items, id);
  const own = announcements.filter((a) => String(a.employeeId) === String(id));

  const toggleLike = (annId) => {
    const next = { ...likes, [annId]: !likes[annId] };
    setLikes(next);
    try {
      localStorage.setItem(likesKey(id), JSON.stringify(next));
    } catch {
      /* localStorage недоступен */
    }
    toast.info(t(next[annId] ? "dashboard.liked" : "dashboard.unliked"));
  };

  if (isLoading) return <Loader className="min-h-dvh" />;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-8">
          <Button component={Link} to="/select-employee" startIcon={<ArrowLeft className="size-4" />}>
            {t("dashboard.back")}
          </Button>
          {employee && (
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="font-bold">{employeeName(employee)}</div>
                <div className="text-xs text-fg-muted">
                  {findById(positions?.items, employee.positionId)?.title ?? t("employee")}
                </div>
              </div>
              <Avatar
                src={employee.profileImagePath ? fileUrl(employee.profileImagePath) : undefined}
                sx={{ bgcolor: "primary.main" }}
              >
                {employee.firstName?.[0]}
              </Avatar>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-10">
        <h1 className="mb-6 text-3xl font-extrabold">{t("dashboard.title")}</h1>

        {!employee ? (
          <Card>
            <EmptyState title={t("dashboard.notFound")} />
          </Card>
        ) : own.length === 0 ? (
          <Card>
            <EmptyState title={t("dashboard.empty")} />
          </Card>
        ) : (
          <div className="space-y-5">
            {own.map((a) => (
              <Card key={a.id} sx={{ p: 3 }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{a.title}</h2>
                    <div className="mt-1 flex items-center gap-1 text-sm text-fg-muted">
                      <CalendarDays className="size-4" />{" "}
                      {formatDate(a.createdAt, { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <Tooltip title={t(likes[a.id] ? "dashboard.unlike" : "dashboard.like")}>
                    <IconButton
                      onClick={() => toggleLike(a.id)}
                      sx={{ color: likes[a.id] ? "primary.main" : undefined }}
                    >
                      <Heart className={cn("size-5", likes[a.id] && "fill-current")} />
                    </IconButton>
                  </Tooltip>
                </div>
                {a.content && <p className="mt-4 whitespace-pre-line text-fg-muted">{a.content}</p>}
                {announcementFiles(a).length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {announcementFiles(a).map((p) => (
                      <FileTile key={p} url={fileUrl(p)} onPreview={setPreview} />
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
      <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
