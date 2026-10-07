import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  useCreatePositionMutation,
  useDeletePositionMutation,
  useGetPositionsQuery,
  useUpdatePositionMutation,
} from "@/entities/org/orgApi";
import { DirectoryPage } from "./DirectoryPage";
import { selectPage, setPage } from "./orgSlice";

export default function PositionsPage() {
  const { t } = useTranslation("org");
  const dispatch = useDispatch();
  const page = useSelector((s) => selectPage(s, "positions"));
  const [create] = useCreatePositionMutation();
  const [update] = useUpdatePositionMutation();
  const [remove] = useDeletePositionMutation();

  return (
    <DirectoryPage
      page={page}
      onPageChange={(p) => dispatch(setPage({ key: "positions", page: p }))}
      config={{
        title: t("positions.title"),
        description: t("positions.subtitle"),
        addLabel: t("positions.add"),
        emptyLabel: t("positions.empty"),
        deleteTitle: (item) => t("positions.deleteConfirm", { name: item.title }),
        query: useGetPositionsQuery(page),
        create,
        update,
        remove,
        columns: [
          {
            key: "title",
            label: t("common:fields.name"),
            render: (p) => <span className="font-semibold">{p.title}</span>,
          },
        ],
        fields: [{ name: "title", label: t("positions.name") }],
        toForm: (p) => ({ title: p.title ?? "" }),
        // При редактировании бэкенд ждёт id и в теле запроса
        toPayload: (v, item) => ({ ...(item?.id != null ? { id: item.id } : {}), title: v.title.trim() }),
      }}
    />
  );
}
