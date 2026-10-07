import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronDown, ChevronUp, CornerDownRight, Pencil, Reply, Send, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { getErrorMessage } from "@/shared/api/normalize";
import { cn } from "@/shared/lib/cn";
import { fileUrl } from "@/shared/lib/files";
import { formatDate, formatDateTime } from "@/shared/lib/format";
import { PageHeader, QueryState, useConfirm, useToast } from "@/shared/ui";
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useGetArticleQuery,
  useGetCommentsQuery,
  useUpdateCommentMutation,
} from "@/features/articles/api";

export default function ArticlePage() {
  const { t } = useTranslation("articles");
  const { id } = useParams();
  const navigate = useNavigate();
  const articleQuery = useGetArticleQuery(id);

  return (
    <QueryState query={articleQuery}>
      {(article) => {
        // Медиа: новый формат — массив media, старый — cover_url / video_url
        const media = article.media?.length
          ? [...article.media].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          : [
              ...(article.video_url ? [{ type: "video", url: article.video_url }] : []),
              ...(article.cover_url ? [{ type: "image", url: article.cover_url }] : []),
            ];
        return (
          <div className="mx-auto max-w-4xl">
            <PageHeader title={article.title} description={article.description} onBack={() => navigate("/article")} />
            <Card sx={{ p: 4 }}>
              {article.created_at && (
                <Chip size="small" label={t("published", { date: formatDate(article.created_at) })} sx={{ mb: 3 }} />
              )}
              {media.map((m, i) =>
                m.type === "video" ? (
                  <video
                    key={i}
                    src={fileUrl(m.url, "articles")}
                    controls
                    className="mb-4 w-full rounded-2xl bg-black"
                  />
                ) : (
                  <img
                    key={i}
                    src={fileUrl(m.url, "articles")}
                    alt=""
                    className="mb-4 w-full rounded-2xl object-cover"
                  />
                ),
              )}
              <div className="text-[16px] leading-relaxed whitespace-pre-line">{article.text}</div>
            </Card>
            <Comments articleId={id} />
          </div>
        );
      }}
    </QueryState>
  );
}

function Comments({ articleId }) {
  const { t } = useTranslation("articles");
  const toast = useToast();
  const { data: comments = [] } = useGetCommentsQuery(articleId);
  const [create, createState] = useCreateCommentMutation();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const total = (list) => list.reduce((n, c) => n + 1 + total(c.replies ?? []), 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await create({ articleId, text: text.trim(), parentId: replyTo?.id }).unwrap();
      setText("");
      setReplyTo(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t("comments.failed")));
    }
  };

  return (
    <Card sx={{ p: 3, mt: 3 }}>
      <h2 className="mb-4 text-lg font-bold">{t("comments.title", { count: total(comments) })}</h2>
      <form onSubmit={submit} className="mb-6">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 text-sm text-fg-muted">
            <CornerDownRight className="size-4" />
            {t("comments.replyTo", { name: replyTo.created_by })}
            <IconButton size="small" onClick={() => setReplyTo(null)}>
              <X className="size-3.5" />
            </IconButton>
          </div>
        )}
        <div className="flex gap-2">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={t("comments.placeholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            loading={createState.isLoading}
            disabled={!text.trim()}
            sx={{ minWidth: 48 }}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </form>
      {comments.length === 0 ? (
        <p className="text-center text-sm text-fg-muted">{t("comments.empty")}</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} articleId={articleId} level={0} onReply={setReplyTo} />
          ))}
        </div>
      )}
    </Card>
  );
}

function CommentItem({ comment, articleId, level, onReply }) {
  const { t } = useTranslation("articles");
  const toast = useToast();
  const confirm = useConfirm();
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [update] = useUpdateCommentMutation();
  const [remove] = useDeleteCommentMutation();
  const replies = comment.replies ?? [];

  const save = async () => {
    if (!draft.trim()) return;
    try {
      await update({ id: comment.id, text: draft.trim(), articleId }).unwrap();
      setEditing(false);
    } catch {
      toast.error(t("comments.failed"));
    }
  };

  const handleDelete = async () => {
    if (!(await confirm({ title: t("comments.deleteConfirm"), description: t("comments.cannotUndo"), danger: true })))
      return;
    try {
      await remove({ id: comment.id, articleId }).unwrap();
    } catch {
      toast.error(t("comments.failed"));
    }
  };

  return (
    <div className={cn(level > 0 && "border-l-2 border-line pl-4")}>
      <div className="flex gap-3">
        <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: "primary.main" }}>
          {comment.created_by?.[0]?.toUpperCase()}
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold">{comment.created_by}</span>
            <span className="text-xs text-fg-muted">{formatDateTime(comment.created_at)}</span>
          </div>
          {editing ? (
            <div className="mt-1 flex gap-1">
              <TextField fullWidth size="small" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} />
              <Button size="small" variant="contained" onClick={save}>
                {t("common:actions.save")}
              </Button>
              <Button size="small" color="inherit" onClick={() => setEditing(false)}>
                {t("common:actions.cancel")}
              </Button>
            </div>
          ) : (
            <p className="mt-0.5 text-sm whitespace-pre-line">{comment.text}</p>
          )}
          <div className="mt-1 flex items-center gap-0.5">
            <Button
              size="small"
              color="inherit"
              startIcon={<Reply className="size-3.5" />}
              onClick={() => onReply(comment)}
            >
              {t("comments.reply")}
            </Button>
            <Tooltip title={t("common:actions.edit")}>
              <IconButton
                size="small"
                onClick={() => {
                  setDraft(comment.text ?? "");
                  setEditing(true);
                }}
              >
                <Pencil className="size-3.5" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("common:actions.delete")}>
              <IconButton size="small" color="error" onClick={handleDelete}>
                <Trash2 className="size-3.5" />
              </IconButton>
            </Tooltip>
            {replies.length > 0 && (
              <Button
                size="small"
                color="inherit"
                endIcon={collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
                onClick={() => setCollapsed((v) => !v)}
              >
                {t(collapsed ? "comments.showReplies" : "comments.hideReplies", { count: replies.length })}
              </Button>
            )}
          </div>
        </div>
      </div>
      {!collapsed && replies.length > 0 && (
        <div className="mt-3 ml-4 space-y-3">
          {replies.map((r) => (
            <CommentItem key={r.id} comment={r} articleId={articleId} level={level + 1} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
