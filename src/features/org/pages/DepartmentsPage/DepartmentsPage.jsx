import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentsQuery,
  useUpdateDepartmentMutation,
} from "@/entities/org/orgApi";
import { DirectoryTable } from "@/features/org/components/DirectoryTable";
import { selectPage, setPage } from "@/features/org/model/orgSlice";

export default function DepartmentsPage() {
  const { t } = useTranslation("org");
  const dispatch = useDispatch();
  const page = useSelector((s) => selectPage(s, "departments"));
  const [create] = useCreateDepartmentMutation();
  const [update] = useUpdateDepartmentMutation();
  const [remove] = useDeleteDepartmentMutation();

  return (
    <DirectoryTable
      page={page}
      onPageChange={(p) => dispatch(setPage({ key: "departments", page: p }))}
      config={{
        title: t("departments.title"),
        description: t("departments.subtitle"),
        addLabel: t("departments.add"),
        emptyLabel: t("departments.empty"),
        deleteTitle: (item) => t("departments.deleteConfirm", { name: item.name }),
        query: useGetDepartmentsQuery(page),
        create,
        update,
        remove,
        columns: [
          {
            key: "name",
            label: t("common:fields.name"),
            render: (d) => <span className="font-semibold">{d.name}</span>,
          },
        ],
        fields: [{ name: "name", label: t("departments.name") }],
        toForm: (d) => ({ name: d.name ?? "" }),
        toPayload: (v) => ({ name: v.name.trim() }),
      }}
    />
  );
}
