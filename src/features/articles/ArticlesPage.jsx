import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { getErrorMessage } from "@/shared/api/normalize";
import { useDebounce } from "@/shared/lib/useDebounce";
import { EmptyState, PageHeader, QueryState, useConfirm, useToast } from "@/shared/ui";
import { ArticleCard } from "./ArticleCard";
import { ArticleDialog } from "./ArticleDialog";
import { toArticleForm } from "./articleForm";
import {
  useCreateArticleMutation,
  useDeleteArticleMutation,
  useGetArticlesQuery,
  useUpdateArticleMutation,
} from "./articlesApi";

export default function ArticlesPage() {
  const { t } = useTranslation("articles");
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const query = useDebounce(search.trim(), 500);
  const [editing, setEditing] = useState(null); // null — закрыт, {} — новая

  const articlesQuery = useGetArticlesQuery({ query });
  const [create, createState] = useCreateArticleMutation();
  const [update, updateState] = useUpdateArticleMutation();
  const [remove] = useDeleteArticleMutation();

  const save = async (data) => {
    try {
      const form = toArticleForm(data);
      if (editing?.id != null) await update({ id: editing.id, form }).unwrap();
      else await create(form).unwrap();
      toast.success(t(editing?.id != null ? "updated" : "created"));
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, t("saveFailed")));
      return false;
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
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <TextField
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 280 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search className="size-4" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button variant="contained" startIcon={<Plus className="size-4" />} onClick={() => setEditing({})}>
              {t("create")}
            </Button>
          </>
        }
      />

      <QueryState query={articlesQuery}>
        {(articles) =>
          articles.length === 0 ? (
            <Card>
              <EmptyState title={t(query ? "notFound" : "empty")} />
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} onEdit={() => setEditing(a)} onDelete={() => handleDelete(a)} />
              ))}
            </div>
          )
        }
      </QueryState>

      <ArticleDialog
        open={editing !== null}
        article={editing?.id != null ? editing : null}
        saving={createState.isLoading || updateState.isLoading}
        onClose={() => setEditing(null)}
        onSubmit={save}
      />
    </>
  );
}
