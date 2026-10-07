/**
 * Диалог создания/редактирования статьи. Используют ArticlesPage и MyArticlesPage.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { fileUrl } from "@/shared/lib/files";
import { useToast } from "@/shared/ui";

const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 100;

/**
 * Форма статьи. onSubmit({ fields, cover, video }) → true, если сохранено.
 * Обложка до 5 МБ, видео до 100 МБ — как в прежней системе.
 */
export function ArticleDialog({ open, article, saving, onClose, onSubmit }) {
  const { t } = useTranslation("articles");
  const toast = useToast();
  const coverRef = useRef(null);
  const videoRef = useRef(null);
  const [fields, setFields] = useState({ title: "", description: "", text: "" });
  const [cover, setCover] = useState(null);
  const [video, setVideo] = useState(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFields({ title: article?.title ?? "", description: article?.description ?? "", text: article?.text ?? "" });
    setCover(null);
    setVideo(null);
    setTouched(false);
  }, [open, article]);

  const pick = (kind) => (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const isImage = kind === "cover";
    if (!file.type.startsWith(isImage ? "image/" : "video/"))
      return toast.error(t(isImage ? "onlyImages" : "onlyVideo"));
    if (file.size > (isImage ? MAX_IMAGE_MB : MAX_VIDEO_MB) * 1024 * 1024) {
      return toast.error(t("tooBig", { mb: isImage ? MAX_IMAGE_MB : MAX_VIDEO_MB }));
    }
    (isImage ? setCover : setVideo)(file);
  };

  const invalid = Object.values(fields).some((v) => !v.trim());

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    const ok = await onSubmit({
      fields: { title: fields.title.trim(), description: fields.description.trim(), text: fields.text.trim() },
      cover,
      video,
    });
    if (ok) onClose();
  };

  // Превью выбранных файлов: blob:-ссылки создаём один раз на файл и освобождаем при смене
  const coverBlob = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover]);
  const videoBlob = useMemo(() => (video ? URL.createObjectURL(video) : null), [video]);
  useEffect(() => () => coverBlob && URL.revokeObjectURL(coverBlob), [coverBlob]);
  useEffect(() => () => videoBlob && URL.revokeObjectURL(videoBlob), [videoBlob]);

  const coverPreview = coverBlob ?? (article?.cover_url ? fileUrl(article.cover_url, "articles") : null);
  const videoPreview = videoBlob ?? (article?.video_url ? fileUrl(article.video_url, "articles") : null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={submit} noValidate>
        <DialogTitle>{t(article ? "edit" : "create")}</DialogTitle>
        <DialogContent className="grid gap-4" sx={{ pt: "8px !important" }}>
          {["title", "description", "text"].map((name) => (
            <TextField
              key={name}
              label={t(`fields.${name}`)}
              required
              multiline={name !== "title"}
              minRows={name === "text" ? 6 : name === "description" ? 2 : undefined}
              value={fields[name]}
              onChange={(e) => setFields((f) => ({ ...f, [name]: e.target.value }))}
              error={touched && !fields[name].trim()}
            />
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ImagePlus className="size-4" />}
                onClick={() => coverRef.current?.click()}
              >
                {t("fields.cover")}
              </Button>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={pick("cover")} />
              {coverPreview && <img src={coverPreview} alt="" className="mt-2 h-40 w-full rounded-xl object-cover" />}
            </div>
            <div>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Video className="size-4" />}
                onClick={() => videoRef.current?.click()}
              >
                {t("fields.video")}
              </Button>
              <input ref={videoRef} type="file" accept="video/*" hidden onChange={pick("video")} />
              {videoPreview && (
                <video src={videoPreview} controls className="mt-2 h-40 w-full rounded-xl bg-black object-cover" />
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" variant="contained" loading={saving}>
            {t("common:actions.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
