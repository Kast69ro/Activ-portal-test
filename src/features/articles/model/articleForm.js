/**
 * Сборка FormData статьи для API. Используют ArticlesPage и MyArticlesPage.
 */
/** FormData статьи в формате API */
export function toArticleForm({ fields, cover, video }) {
  const form = new FormData();
  form.append("title", fields.title);
  form.append("description", fields.description);
  form.append("text", fields.text);
  form.append("status", "published");
  if (cover) form.append("cover", cover);
  if (video) form.append("video", video);
  return form;
}
