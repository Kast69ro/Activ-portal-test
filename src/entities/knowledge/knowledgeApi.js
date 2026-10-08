/**
 * API базы знаний (service: "main"). Теги: Folder, Announcement.
 * Используется доменом knowledge (LibraryView, диалоги).
 */
import { baseApi } from "@/shared/api/baseApi";
import { unwrapItem, unwrapList } from "@/shared/api/normalize";

/**
 * База знаний: папки и материалы в них.
 * Материал (на бэкенде — Announcement) — заголовок, описание и файлы.
 * Папки бывают двух типов: видеоуроки и документация.
 */
export const FOLDER_TYPE = { VIDEO: 0, DOCUMENTATION: 1 };

export const knowledgeApi = baseApi.enhanceEndpoints({ addTagTypes: ["Folder", "Announcement"] }).injectEndpoints({
  endpoints: (build) => ({
    getFolders: build.query({
      query: (folderType) => ({ url: "/Folder", params: folderType != null ? { folderType } : undefined }),
      transformResponse: (res, _, folderType) =>
        unwrapList(res).items.filter((f) => folderType == null || isFolderOfType(f, folderType)),
      providesTags: ["Folder"],
    }),
    createFolder: build.mutation({
      query: (body) => ({ url: "/Folder", method: "POST", body }),
      transformResponse: unwrapItem,
      invalidatesTags: ["Folder"],
    }),
    updateFolder: build.mutation({
      query: ({ id, ...body }) => ({ url: `/Folder/${id}`, method: "PUT", body }),
      invalidatesTags: ["Folder"],
    }),
    deleteFolder: build.mutation({
      query: (id) => ({ url: `/Folder/${id}`, method: "DELETE" }),
      invalidatesTags: ["Folder", "Announcement"],
    }),

    getAnnouncements: build.query({
      query: () => "/Announcement",
      transformResponse: (res) => unwrapList(res).items,
      providesTags: ["Announcement"],
    }),
    /** data: { title, content, folderId, subDepartmentId, employeeId, files: File[] } */
    createAnnouncement: build.mutation({
      query: (data) => ({ url: "/Announcement", method: "POST", body: toFormData(data, true) }),
      transformResponse: unwrapItem,
      invalidatesTags: ["Announcement", "Folder"],
    }),
    updateAnnouncement: build.mutation({
      query: ({ id, ...data }) => ({ url: `/Announcement/${id}`, method: "PUT", body: toFormData(data, false) }),
      invalidatesTags: ["Announcement", "Folder"],
    }),
    deleteAnnouncement: build.mutation({
      query: (id) => ({ url: `/Announcement/${id}`, method: "DELETE" }),
      invalidatesTags: ["Announcement", "Folder"],
    }),
  }),
});

export const {
  useGetFoldersQuery,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = knowledgeApi;

// ─── Помощники ─────────────────────────────────────────────────────────────

/** Формат multipart, который ждёт бэкенд. Первый файл дублируется в ProfileImage — так было в прежней системе. */
function toFormData({ title, content, subDepartmentId, employeeId, folderId, files = [] }, isCreate) {
  const form = new FormData();
  form.append("Title", title ?? "");
  form.append("Content", content ?? "");
  const num = (v) => String(Number(v ?? 0));
  if (isCreate || subDepartmentId != null) form.append("SubDepartmentId", num(subDepartmentId));
  if (isCreate || employeeId != null) form.append("EmployeeId", num(employeeId));
  if (isCreate || folderId != null) form.append("FolderId", num(folderId));
  files.forEach((file, i) => {
    if (i === 0) form.append("ProfileImage", file);
    form.append("Files", file);
  });
  return form;
}

export function isFolderOfType(folder, type) {
  const ft = folder?.folderType;
  if (ft == null) return false;
  if (typeof ft === "number") return ft === type;
  const s = String(ft).toLowerCase();
  return type === FOLDER_TYPE.VIDEO
    ? ["0", "video", "videos"].includes(s)
    : ["1", "documentation", "documents"].includes(s);
}

/** Все пути к файлам материала */
export function announcementFiles(item) {
  const paths = [];
  if (item?.profileImagePath) paths.push(item.profileImagePath);
  for (const f of item?.files ?? []) {
    const p = typeof f === "string" ? f : (f.profileImagePath ?? f.path ?? f.url ?? f.filePath);
    if (p && !paths.includes(p)) paths.push(p);
  }
  return paths;
}

/**
 * Материалы раздела: вложенные в папки этого типа + материалы без папки.
 * Так же собирала список прежняя система.
 */
export function collectLibraryItems(folders, announcements) {
  const folderIds = new Set(folders.map((f) => String(f.id)));
  const items = new Map();

  for (const folder of folders) {
    for (const a of folder.announcements ?? []) items.set(String(a.id), { ...a, folderId: folder.id });
  }
  for (const a of announcements) {
    if (items.has(String(a.id))) continue;
    const fid = a.folderId && Number(a.folderId) !== 0 ? String(a.folderId) : null;
    if (fid === null || folderIds.has(fid)) items.set(String(a.id), { ...a, folderId: fid });
  }
  return [...items.values()];
}
