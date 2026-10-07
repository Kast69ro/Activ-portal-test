import { useEffect, useMemo, useState } from "react";
import { Clock, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { ALL, employeeName, findById, useGetEmployeesQuery, useGetSubDepartmentsQuery } from "@/entities/org/orgApi";
import { SESSION_STATUS, sessionStatus, testTitle } from "@/entities/testing/model";
import { useGetAssignmentsQuery, useGetSessionsQuery } from "@/entities/testing/testingApi";

import { MAX_DURATION, PRESET_DURATIONS } from "../constants";

/**
 * Запуск теста или опроса для сотрудника (kind = "test" | "survey").
 * Для тестов проверяет: пройден ли уже тест и нет ли незавершённой сессии.
 * onStart({ item, employeeId, subDepartmentId, duration, existingSession })
 */
export function StartDialog({ kind, open, items, initial, loading, onClose, onStart }) {
  const { t, i18n } = useTranslation("testing");
  const isTest = kind === "test";

  const { data: employees } = useGetEmployeesQuery(ALL, { skip: !open });
  const { data: subdepartments } = useGetSubDepartmentsQuery(ALL, { skip: !open });
  const { data: sessions = [] } = useGetSessionsQuery(undefined, { skip: !open || !isTest });
  const { data: assignments = [] } = useGetAssignmentsQuery(undefined, { skip: !open || !isTest });

  const [itemId, setItemId] = useState("");
  const [employeeId, setEmployeeId] = useState(null);
  const [duration, setDuration] = useState(5);

  useEffect(() => {
    if (!open) return;
    setItemId(initial?.itemId ?? "");
    setEmployeeId(initial?.employeeId ?? null);
    setDuration(5);
  }, [open, initial]);

  const employeeList = useMemo(() => {
    const subs = subdepartments?.items ?? [];
    return (employees?.items ?? [])
      .map((e) => ({ ...e, group: findById(subs, e.subDepartmentId)?.name ?? t("start.noGroup") }))
      .sort((a, b) => a.group.localeCompare(b.group));
  }, [employees, subdepartments, t]);

  const employee = findById(employeeList, employeeId) ?? null;

  // Отдел сотрудника: из карточки, иначе — из назначения теста (как в прежней системе)
  const subDepartmentId =
    employee?.subDepartmentId ??
    assignments.find((a) => String(a.employeeId) === String(employeeId))?.subDepartmentId ??
    null;
  const subDepartment = findById(subdepartments?.items, subDepartmentId);

  const sessionsOf = sessions.filter(
    (s) => String(s.employeeId) === String(employeeId) && String(s.testId) === String(itemId),
  );
  const alreadyPassed = isTest && sessionsOf.some((s) => sessionStatus(s.status) === SESSION_STATUS.COMPLETED);
  const existingSession = isTest
    ? sessionsOf.find((s) => sessionStatus(s.status) === SESSION_STATUS.IN_PROGRESS)
    : null;

  const item = items.find((x) => String(x.id) === String(itemId));
  const canStart = item && employee && subDepartmentId && !alreadyPassed && duration > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Play className="size-5 text-brand-600" />
        {t(isTest ? "start.testTitle" : "start.surveyTitle")}
      </DialogTitle>
      <DialogContent className="grid gap-4" sx={{ pt: "8px !important" }}>
        <TextField
          select
          label={t(isTest ? "start.test" : "start.survey")}
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
        >
          {items.map((x) => (
            <MenuItem key={x.id} value={x.id}>
              {testTitle(x, i18n.language)}
            </MenuItem>
          ))}
        </TextField>

        <div>
          <TextField
            label={t("start.duration")}
            type="number"
            fullWidth
            value={duration}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n > 0 && n <= MAX_DURATION) setDuration(n);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Clock className="size-4" />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">{t("start.min")}</InputAdornment>,
              },
              htmlInput: { min: 1, max: MAX_DURATION },
            }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-fg-muted">{t("start.presets")}</span>
            {PRESET_DURATIONS.map((m) => (
              <Chip
                key={m}
                size="small"
                label={m}
                color={duration === m ? "primary" : "default"}
                variant={duration === m ? "filled" : "outlined"}
                onClick={() => setDuration(m)}
              />
            ))}
          </div>
        </div>

        <Autocomplete
          options={employeeList}
          groupBy={(e) => e.group}
          value={employee}
          onChange={(_, v) => setEmployeeId(v?.id ?? null)}
          getOptionLabel={employeeName}
          isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
          renderInput={(params) => <TextField {...params} label={t("start.employee")} />}
        />

        {employee &&
          (subDepartment ? (
            <div className="rounded-xl bg-muted px-4 py-3 text-sm">
              <span className="text-fg-muted">{t("common:fields.subdepartment")}: </span>
              <span className="font-semibold">{subDepartment.name}</span>
            </div>
          ) : (
            <Alert severity="warning">{t("start.noSubdepartment")}</Alert>
          ))}

        {alreadyPassed && (
          <Alert severity="error">
            {t("start.alreadyPassed")}. {t("start.cannotRetake")}
          </Alert>
        )}
        {existingSession && !alreadyPassed && <Alert severity="info">{t("start.hasUnfinished")}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose}>
          {t("common:actions.close")}
        </Button>
        <Button
          variant="contained"
          startIcon={<Play className="size-4" />}
          disabled={!canStart}
          loading={loading}
          onClick={() => onStart({ item, employeeId, subDepartmentId, duration, existingSession })}
        >
          {existingSession ? t("start.continue") : t("start.submit", { minutes: duration })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
