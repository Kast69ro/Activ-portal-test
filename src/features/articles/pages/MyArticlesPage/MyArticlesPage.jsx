import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import { getErrorMessage } from "@/shared/api/normalize";
import { EmptyState, PageHeader, QueryState, useConfirm, useToast } from "@/shared/ui";
import { ArticleCard } from "@/features/articles/components/ArticleCard";
import { ArticleDialog } from "@/features/articles/components/ArticleDialog";
import { toArticleForm } from "@/features/articles/model/articleForm";
import {
  useCreateArticleMutation,
  useDeleteMyArticleMutation,
  useGetMyProfileQuery,
  useUpdateMyArticleFilesMutation,
  useUpdateMyArticleMutation,
} from "@/features/articles/api";

/** Статьи текущего пользователя (/api/me) */
export default function MyArticlesPage() {
  const { t } = useTranslation("articles");
  const toast = useToast();
  const confirm = useConfirm();
  const profileQuery = useGetMyProfileQuery();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [create] = useCreateArticleMutation();
  const [updateFields] = useUpdateMyArticleMutation();
  const [updateFiles] = useUpdateMyArticleFilesMutation();
  const [remove] = useDeleteMyArticleMutation();

  const save = async (data) => {
    setSaving(true);
    try {
      if (editing?.id != null) {
        // Текст и файлы своей статьи обновляются отдельными запросами
        await updateFields({ id: editing.id, ...data.fields, status: "published" }).unwrap();
        if (data.cover || data.video) {
          const form = new FormData();
          if (data.cover) form.append("cover", data.cover);
          if (data.video) form.append("video", data.video);
          await updateFiles({ id: editing.id, form }).unwrap();
        }
        toast.success(t("updated"));
      } else {
        await create(toArticleForm(data)).unwrap();
        toast.success(t("created"));
      }
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, t("saveFailed")));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (article) => {
    if (!(await confirm({ title: t("deleteConfirm", { name: article.title }), danger: true }))) return;
    try {
      await remove(article.id).unwrap();
      toast.success(t("common:toast.deleted"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  return (
    <>
      <PageHeader
        title={t("mine.title")}
        description={profileQuery.data?.login ? t("mine.user", { login: profileQuery.data.login }) : undefined}
        actions={
          <Button variant="contained" startIcon={<Plus className="size-4" />} onClick={() => setEditing({})}>
            {t("create")}
          </Button>
        }
      />
      <QueryState query={profileQuery}>
        {(profile) =>
          (profile?.articles ?? []).length === 0 ? (
            <Card>
              <EmptyState title={t("mine.empty")} />
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {profile.articles.map((a) => (
                <ArticleCard key={a.id} article={a} onEdit={() => setEditing(a)} onDelete={() => handleDelete(a)} />
              ))}
            </div>
          )
        }
      </QueryState>
      <ArticleDialog
        open={editing !== null}
        article={editing?.id != null ? editing : null}
        saving={saving}
        onClose={() => setEditing(null)}
        onSubmit={save}
      />
    </>
  );
}
