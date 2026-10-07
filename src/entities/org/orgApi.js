import { baseApi } from "@/shared/api/baseApi";
import { unwrapList } from "@/shared/api/normalize";

/**
 * Оргструктура банка: управления, отделы, должности, сотрудники.
 * Нужна многим фичам (тесты, база знаний, администрирование), поэтому живёт в entities.
 *
 * Списки приходят постранично: { data: [...], totalRecords } → { items, total }.
 * Справочники для выпадающих списков запрашиваются целиком: ALL = { pageNumber: 1, pageSize: 1000 }.
 */
export const ALL = { pageNumber: 1, pageSize: 1000 };

const paged = ({ pageNumber = 1, pageSize = 10 } = {}) => ({ PageNumber: pageNumber, PageSize: pageSize });

/** CRUD-эндпоинты для одного ресурса — у всех четырёх справочников одинаковый контракт */
const crud = (build, resource, tag) => ({
  list: build.query({
    query: (page) => ({ url: `/${resource}`, params: paged(page) }),
    transformResponse: unwrapList,
    providesTags: [tag],
  }),
  create: build.mutation({
    query: (body) => ({ url: `/${resource}`, method: "POST", body }),
    invalidatesTags: [tag],
  }),
  update: build.mutation({
    query: ({ id, ...body }) => ({ url: `/${resource}/${id}`, method: "PUT", body }),
    invalidatesTags: [tag],
  }),
  remove: build.mutation({
    query: (id) => ({ url: `/${resource}/${id}`, method: "DELETE" }),
    invalidatesTags: [tag],
  }),
});

export const orgApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["Department", "SubDepartment", "Position", "Employee"] })
  .injectEndpoints({
    endpoints: (build) => {
      const departments = crud(build, "Department", "Department");
      const subdepartments = crud(build, "SubDepartment", "SubDepartment");
      const positions = crud(build, "Position", "Position");
      const employees = crud(build, "Employee", "Employee");

      return {
        getDepartments: departments.list,
        createDepartment: departments.create,
        updateDepartment: departments.update,
        deleteDepartment: departments.remove,

        getSubDepartments: subdepartments.list,
        createSubDepartment: subdepartments.create,
        updateSubDepartment: subdepartments.update,
        deleteSubDepartment: subdepartments.remove,

        getPositions: positions.list,
        createPosition: positions.create,
        updatePosition: positions.update,
        deletePosition: positions.remove,

        getEmployees: employees.list,
        getEmployee: build.query({
          query: (id) => `/Employee/${id}`,
          transformResponse: (res) => res?.data ?? res,
          providesTags: (_, __, id) => [{ type: "Employee", id }],
        }),
        createEmployee: employees.create,
        updateEmployee: employees.update,
        deleteEmployee: employees.remove,
      };
    },
  });

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetSubDepartmentsQuery,
  useCreateSubDepartmentMutation,
  useUpdateSubDepartmentMutation,
  useDeleteSubDepartmentMutation,
  useGetPositionsQuery,
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useDeletePositionMutation,
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = orgApi;

// ─── Помощники ─────────────────────────────────────────────────────────────

/** «Имя Фамилия» */
export const employeeName = (e) =>
  e ? [e.firstName, e.lastName].filter(Boolean).join(" ").trim() || e.email || `#${e.id}` : "—";

/** «Фамилия Имя Отчество» — для отчётов */
export const employeeFio = (e) =>
  e ? [e.lastName, e.firstName, e.middleName ?? e.patronymic].filter(Boolean).join(" ").trim() || `#${e.id}` : "";

/** Поиск по id в справочнике (id приходят то числом, то строкой) */
export const findById = (list, id) => (id == null ? undefined : list?.find((x) => String(x.id) === String(id)));
