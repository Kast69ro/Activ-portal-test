/**
 * Используют TestsPage и SurveysPage.
 */
import { CalendarDays, Link2, ListChecks, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import { testDescription, testTitle } from "@/entities/testing/model";
import { formatDate } from "@/shared/lib/format";

/** Карточка теста или опроса. Действия показываются только администратору. */
export function TestCard({ test, icon: Icon, highlighted, isAdmin, onOpen, onEdit, onDelete, onLink }) {
  const { t, i18n } = useTranslation("testing");
  const description = testDescription(test, i18n.language);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        transition: "all .2s",
        borderColor: highlighted ? "primary.main" : undefined,
        "&:hover": { boxShadow: 4 },
      }}
    >
      <CardActionArea
        onClick={onOpen}
        disabled={!onOpen}
        sx={{ p: 2.5, flex: 1, alignItems: "flex-start", display: "flex", flexDirection: "column" }}
      >
        <div className="flex w-full items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 font-bold">{testTitle(test, i18n.language)}</div>
            {test.createdAt && (
              <div className="mt-1 flex items-center gap-1 text-xs text-fg-muted">
                <CalendarDays className="size-3.5" /> {formatDate(test.createdAt)}
              </div>
            )}
          </div>
        </div>
        {description && <p className="mt-3 line-clamp-3 text-sm text-fg-muted">{description}</p>}
        <Chip
          size="small"
          sx={{ mt: 2 }}
          icon={<ListChecks className="size-3.5" />}
          label={t("questionCount", { count: test.questions?.length ?? 0 })}
        />
      </CardActionArea>

      {isAdmin && (
        <div className="flex justify-end gap-1 border-t border-line px-3 py-2">
          {onLink && (
            <Button size="small" startIcon={<Link2 className="size-4" />} onClick={onLink}>
              {t("link.button")}
            </Button>
          )}
          <Button size="small" color="inherit" startIcon={<Pencil className="size-4" />} onClick={onEdit}>
            {t("common:actions.edit")}
          </Button>
          <Button size="small" color="error" startIcon={<Trash2 className="size-4" />} onClick={onDelete}>
            {t("common:actions.delete")}
          </Button>
        </div>
      )}
    </Card>
  );
}
