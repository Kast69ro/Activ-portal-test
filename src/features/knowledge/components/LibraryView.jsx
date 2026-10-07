import { useMemo, useState } from "react";
import {
  CalendarDays,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import {
  announcementFiles,
  collectLibraryItems,
  useDeleteAnnouncementMutation,
  useDeleteFolderMutation,
  useGetAnnouncementsQuery,
  useGetFoldersQuery,
  useUpdateAnnouncementMutation,
} from "@/entities/knowledge/knowledgeApi";
import { ALL, employeeName, findById, useGetEmployeesQuery, useGetSubDepartmentsQuery } from "@/entities/org/orgApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { cn } from "@/shared/lib/cn";
import { fileUrl } from "@/shared/lib/files";
import { formatDateTime } from "@/shared/lib/format";
import { selectIsAdmin } from "@/shared/model/auth";
import { EmptyState, FilePreviewDialog, FileTile, PageHeader, QueryState, useConfirm, useToast } from "@/shared/ui";
import { FolderDialog } from "./FolderDialog";
import { selectFolder, selectSearch, selectSelectedFolder, setSearch } from "@/features/knowledge/model/knowledgeSlice";
import { MaterialDialog } from "./MaterialDialog";

/**
 * Библиотека базы знаний: папки слева, материалы справа.
 * library — "video" | "documentation" (ключ переводов и состояния), folderType — тип папок на бэкенде.
 */
export function LibraryView({ library, folderType, accept }) {
  const { t } = useTranslation("knowledge");
  const dispatch = useDispatch();
  const isAdmin = useSelector(selectIsAdmin);
  const selected = useSelector((s) => selectSelectedFolder(s, library));
  const search = useSelector((s) => selectSearch(s, library));

  const foldersQuery = useGetFoldersQuery(folderType);
  const announcementsQuery = useGetAnnouncementsQuery();
  const { data: employees } = useGetEmployeesQuery(ALL);
  const { data: subdepartments } = useGetSubDepartmentsQuery(ALL);

  const [preview, setPreview] = useState(null);
  const [material, setMaterial] = useState(null); // null — закрыт, {} — новый
  const [folderDialog, setFolderDialog] = useState(null);

  const folders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);
  const items = useMemo(
    () => collectLibraryItems(folders, announcementsQuery.data ?? []),
    [folders, announcementsQuery.data],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((item) =>
        selected === "all" ? true : selected === "none" ? !item.folderId : String(item.folderId) === String(selected),
      )
      .filter((item) => !q || `${item.title} ${item.content}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
  }, [items, selected, search]);

  const countIn = (folderId) => items.filter((i) => String(i.folderId) === String(folderId)).length;
  const unfiled = items.filter((i) => !i.folderId).length;

  return (
    <>
      <PageHeader
        title={t(`${library}.title`)}
        description={t(`${library}.subtitle`)}
        actions={
          <>
            <TextField
              placeholder={t("search")}
              value={search}
              onChange={(e) => dispatch(setSearch({ library, search: e.target.value }))}
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
            {isAdmin && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<FolderPlus className="size-4" />}
                  onClick={() => setFolderDialog({})}
                >
                  {t("folder.add")}
                </Button>
                <Button variant="contained" startIcon={<Plus className="size-4" />} onClick={() => setMaterial({})}>
                  {t(`${library}.add`)}
                </Button>
              </>
            )}
          </>
        }
      />

      <QueryState queries={[foldersQuery, announcementsQuery]}>
        {() => (
          <div className="grid grid-cols-[260px_1fr] items-start gap-6">
            <Card sx={{ p: 1.5, position: "sticky", top: 88 }}>
              <FolderButton
                active={selected === "all"}
                icon={FolderOpen}
                label={t("folder.all")}
                count={items.length}
                onClick={() => dispatch(selectFolder({ library, folder: "all" }))}
              />
              <Divider sx={{ my: 1 }} />
              {folders.map((f) => (
                <FolderButton
                  key={f.id}
                  active={String(selected) === String(f.id)}
                  label={f.name}
                  count={countIn(f.id)}
                  onClick={() => dispatch(selectFolder({ library, folder: f.id }))}
                  actions={
                    isAdmin && (
                      <FolderMenu folder={f} items={items} library={library} onRename={() => setFolderDialog(f)} />
                    )
                  }
                />
              ))}
              {folders.length === 0 && <p className="px-3 py-2 text-sm text-fg-muted">{t("folder.empty")}</p>}
              {unfiled > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <FolderButton
                    active={selected === "none"}
                    label={t("folder.none")}
                    count={unfiled}
                    muted
                    onClick={() => dispatch(selectFolder({ library, folder: "none" }))}
                  />
                </>
              )}
            </Card>

            <div className="space-y-4">
              {visible.length === 0 ? (
                <Card>
                  <EmptyState
                    title={t(search ? "notFound" : `${library}.empty`)}
                    action={
                      isAdmin &&
                      !search && (
                        <Button
                          variant="contained"
                          startIcon={<Plus className="size-4" />}
                          onClick={() => setMaterial({})}
                        >
                          {t(`${library}.add`)}
                        </Button>
                      )
                    }
                  />
                </Card>
              ) : (
                visible.map((item) => (
                  <MaterialCard
                    key={item.id}
                    item={item}
                    folders={folders}
                    isAdmin={isAdmin}
                    author={employeeName(findById(employees?.items, item.employeeId))}
                    hasAuthor={Boolean(findById(employees?.items, item.employeeId))}
                    subdepartment={findById(subdepartments?.items, item.subDepartmentId)?.name}
                    onEdit={() => setMaterial(item)}
                    onPreview={setPreview}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </QueryState>

      <MaterialDialog
        open={material !== null}
        item={material}
        library={library}
        accept={accept}
        folders={folders}
        defaultFolderId={selected !== "all" && selected !== "none" ? selected : ""}
        onClose={() => setMaterial(null)}
      />
      <FolderDialog
        open={folderDialog !== null}
        folder={folderDialog}
        folderType={folderType}
        onClose={() => setFolderDialog(null)}
        onCreated={(f) => f?.id && dispatch(selectFolder({ library, folder: f.id }))}
      />
      <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />
    </>
  );
}

function FolderButton({ active, icon: Icon = Folder, label, count, onClick, actions, muted }) {
  return (
    <div
      className={cn(
        "group flex items-center rounded-xl transition-colors",
        active ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300" : "hover:bg-muted",
      )}
    >
      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-sm font-semibold"
      >
        <Icon className={cn("size-4 shrink-0", muted ? "text-fg-muted" : "text-amber-500")} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="text-xs text-fg-muted">{count}</span>
      </button>
      {actions}
    </div>
  );
}

function FolderMenu({ folder, items, onRename }) {
  const { t } = useTranslation("knowledge");
  const toast = useToast();
  const confirm = useConfirm();
  const [anchor, setAnchor] = useState(null);
  const [deleteFolder] = useDeleteFolderMutation();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();

  const remove = async () => {
    setAnchor(null);
    const inside = items.filter((i) => String(i.folderId) === String(folder.id));
    const ok = await confirm({
      title: t("folder.deleteConfirm", { name: folder.name }),
      description: inside.length ? t("folder.deleteWithItems", { count: inside.length }) : undefined,
      danger: true,
    });
    if (!ok) return;
    try {
      // Как и прежняя система: сначала материалы папки, потом сама папка
      for (const item of inside) await deleteAnnouncement(item.id).unwrap();
      await deleteFolder(folder.id).unwrap();
      toast.success(t("common:toast.deleted"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  return (
    <>
      <IconButton
        size="small"
        className="opacity-0 group-hover:opacity-100"
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <MoreVertical className="size-4" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onRename();
          }}
        >
          <ListItemIcon>
            <Pencil className="size-4" />
          </ListItemIcon>
          {t("folder.rename")}
        </MenuItem>
        <MenuItem onClick={remove} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <Trash2 className="size-4" />
          </ListItemIcon>
          {t("common:actions.delete")}
        </MenuItem>
      </Menu>
    </>
  );
}

function MaterialCard({ item, folders, isAdmin, author, hasAuthor, subdepartment, onEdit, onPreview }) {
  const { t } = useTranslation("knowledge");
  const toast = useToast();
  const confirm = useConfirm();
  const [moveAnchor, setMoveAnchor] = useState(null);
  const [update] = useUpdateAnnouncementMutation();
  const [remove] = useDeleteAnnouncementMutation();
  const files = announcementFiles(item);
  const folder = findById(folders, item.folderId);

  const move = async (folderId) => {
    setMoveAnchor(null);
    try {
      await update({
        id: item.id,
        title: item.title,
        content: item.content,
        subDepartmentId: item.subDepartmentId,
        employeeId: item.employeeId,
        folderId: folderId ?? 0,
      }).unwrap();
      toast.success(t("moved"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  const handleDelete = async () => {
    if (!(await confirm({ title: t("deleteConfirm", { name: item.title }), danger: true }))) return;
    try {
      await remove(item.id).unwrap();
      toast.success(t("common:toast.deleted"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{item.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {hasAuthor && <Chip size="small" icon={<User className="size-3.5" />} label={author} />}
            <Chip size="small" icon={<CalendarDays className="size-3.5" />} label={formatDateTime(item.createdAt)} />
            {subdepartment && <Chip size="small" variant="outlined" label={subdepartment} />}
            {folder && (
              <Chip size="small" variant="outlined" icon={<Folder className="size-3.5" />} label={folder.name} />
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-0.5">
            <Tooltip title={t("common:actions.edit")}>
              <IconButton size="small" onClick={onEdit}>
                <Pencil className="size-4" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("move")}>
              <IconButton size="small" onClick={(e) => setMoveAnchor(e.currentTarget)}>
                <FolderInput className="size-4" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("common:actions.delete")}>
              <IconButton size="small" color="error" onClick={handleDelete}>
                <Trash2 className="size-4" />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={moveAnchor} open={Boolean(moveAnchor)} onClose={() => setMoveAnchor(null)}>
              {folders.map((f) => (
                <MenuItem key={f.id} selected={String(f.id) === String(item.folderId)} onClick={() => move(f.id)}>
                  <ListItemIcon>
                    <Folder className="size-4" />
                  </ListItemIcon>
                  {f.name}
                </MenuItem>
              ))}
              {item.folderId && (
                <MenuItem onClick={() => move(null)}>
                  <ListItemIcon>
                    <FolderOpen className="size-4" />
                  </ListItemIcon>
                  {t("removeFromFolder")}
                </MenuItem>
              )}
            </Menu>
          </div>
        )}
      </div>

      {item.content && <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed">{item.content}</p>}

      {files.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-5">
          {files.map((path) => (
            <FileTile key={path} url={fileUrl(path)} onPreview={onPreview} />
          ))}
        </div>
      )}
    </Card>
  );
}
