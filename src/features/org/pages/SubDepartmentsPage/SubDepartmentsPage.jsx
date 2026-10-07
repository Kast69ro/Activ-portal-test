import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Chip from "@mui/material/Chip";
import {
  ALL,
  findById,
  useCreateSubDepartmentMutation,
  useDeleteSubDepartmentMutation,
  useGetDepartmentsQuery,
  useGetSubDepartmentsQuery,
  useUpdateSubDepartmentMutation,
} from "@/entities/org/orgApi";
import { DirectoryTable } from "@/features/org/components/DirectoryTable";
import { selectPage, setPage } from "@/features/org/model/orgSlice";

export default function SubDepartmentsPage() {
  const { t } = useTranslation("org");
  const dispatch = useDispatch();
  const page = useSelector((s) => selectPage(s, "subdepartments"));
  const { data: departments } = useGetDepartmentsQuery(ALL);
  const [create] = useCreateSubDepartmentMutation();
  const [update] = useUpdateSubDepartmentMutation();
  const [remove] = useDeleteSubDepartmentMutation();
  const deps = departments?.items ?? [];

  return (
    <DirectoryTable
      page={page}
      onPageChange={(p) => dispatch(setPage({ key: "subdepartments", page: p }))}
      config={{
        title: t("subdepartments.title"),
        description: t("subdepartments.subtitle"),
        addLabel: t("subdepartments.add"),
        emptyLabel: t("subdepartments.empty"),
        deleteTitle: (item) => t("subdepartments.deleteConfirm", { name: item.name }),
        query: useGetSubDepartmentsQuery(page),
        create,
        update,
        remove,
        columns: [
          {
            key: "name",
            label: t("common:fields.name"),
            render: (s) => <span className="font-semibold">{s.name}</span>,
          },
          {
            key: "department",
            label: t("common:fields.department"),
            render: (s) => {
              const dep = findById(deps, s.departmentId);
              return dep ? <Chip size="small" label={dep.name} /> : <span className="text-fg-muted">—</span>;
            },
          },
        ],
        fields: [
          { name: "name", label: t("subdepartments.name") },
          {
            name: "departmentId",
            label: t("common:fields.department"),
            options: deps.map((d) => ({ value: d.id, label: d.name })),
          },
        ],
        toForm: (s) => ({ name: s.name ?? "", departmentId: s.departmentId ?? "" }),
        toPayload: (v) => ({ name: v.name.trim(), departmentId: v.departmentId }),
      }}
    />
  );
}
