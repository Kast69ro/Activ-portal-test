import { Link } from "react-router";
import { CalendarDays, Newspaper, Pencil, PlayCircle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { fileUrl } from "@/shared/lib/files";
import { formatDate } from "@/shared/lib/format";

export function ArticleCard({ article, onEdit, onDelete }) {
  const { t } = useTranslation("articles");
  const cover = article.cover_url && fileUrl(article.cover_url, "articles");

  return (
    <Card sx={{ display: "flex", flexDirection: "column", transition: "all .2s", "&:hover": { boxShadow: 4 } }}>
      <CardActionArea
        component={Link}
        to={`/article/${article.id}`}
        sx={{ flex: 1, alignItems: "stretch", display: "flex", flexDirection: "column" }}
      >
        <div className="relative h-44 bg-muted">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-fg-muted">
              <Newspaper className="size-10" />
            </div>
          )}
          {article.video_url && <PlayCircle className="absolute right-3 bottom-3 size-8 text-white drop-shadow" />}
        </div>
        <div className="flex-1 p-4">
          <div className="line-clamp-2 font-bold">{article.title}</div>
          <p className="mt-1 line-clamp-3 text-sm text-fg-muted">{article.description}</p>
          {article.created_at && (
            <div className="mt-3 flex items-center gap-1 text-xs text-fg-muted">
              <CalendarDays className="size-3.5" /> {formatDate(article.created_at)}
            </div>
          )}
        </div>
      </CardActionArea>
      {(onEdit || onDelete) && (
        <div className="flex justify-end gap-1 border-t border-line px-2 py-1.5">
          {onEdit && (
            <Tooltip title={t("common:actions.edit")}>
              <IconButton size="small" onClick={onEdit}>
                <Pencil className="size-4" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title={t("common:actions.delete")}>
              <IconButton size="small" color="error" onClick={onDelete}>
                <Trash2 className="size-4" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      )}
    </Card>
  );
}
