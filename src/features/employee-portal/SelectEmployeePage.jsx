/**
 * Выбор профиля сотрудника для входа в кабинет.
 * Маршрут: /select-employee (без меню). Доступ: все вошедшие.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, House, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { ALL, employeeName, findById, useGetEmployeesQuery, useGetPositionsQuery } from "@/entities/org/orgApi";
import { fileUrl } from "@/shared/lib/files";
import { EmptyState, LogoMark, QueryState } from "@/shared/ui";

export default function SelectEmployeePage() {
  const { t } = useTranslation("employee-portal");
  const [search, setSearch] = useState("");
  const query = useGetEmployeesQuery(ALL);
  const { data: positions } = useGetPositionsQuery(ALL);

  const filtered = useMemo(
    () => (query.data?.items ?? []).filter((e) => employeeName(e).toLowerCase().includes(search.trim().toLowerCase())),
    [query.data, search],
  );

  return (
    <div className="min-h-dvh bg-bg">
      <section className="relative overflow-hidden bg-linear-to-br from-brand-600 via-brand-700 to-brand-900 px-8 pt-10 pb-24 text-white">
        <LogoMark className="absolute -top-16 -right-10 size-96 opacity-10 brightness-0 invert" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex justify-end">
            <Button
              component={Link}
              to="/"
              startIcon={<House className="size-4" />}
              sx={{ color: "#fff", borderColor: "rgb(255 255 255 / .4)" }}
              variant="outlined"
            >
              {t("toSystem")}
            </Button>
          </div>
          <div className="mt-6 text-center">
            <h1 className="text-4xl font-extrabold">{t("select.title")}</h1>
            <p className="mt-3 text-lg text-white/85">{t("select.subtitle")}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-12 max-w-6xl px-8 pb-16">
        <Card sx={{ p: 1.5, mb: 4, mx: "auto", maxWidth: 520 }}>
          <TextField
            fullWidth
            size="medium"
            placeholder={t("select.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="standard"
            slotProps={{
              input: {
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <Search className="ml-2 size-5" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Card>

        <QueryState query={query}>
          {() =>
            filtered.length === 0 ? (
              <Card>
                <EmptyState title={t("select.notFound")} description={t("select.notFoundHint")} />
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {filtered.map((e) => (
                  <Card
                    key={e.id}
                    sx={{
                      p: 4,
                      textAlign: "center",
                      transition: "all .2s",
                      "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
                    }}
                  >
                    <Avatar
                      src={e.profileImagePath ? fileUrl(e.profileImagePath) : undefined}
                      sx={{ width: 88, height: 88, mx: "auto", fontSize: 30, fontWeight: 700, bgcolor: "primary.main" }}
                    >
                      {e.firstName?.[0]}
                    </Avatar>
                    <div className="mt-4 text-lg font-bold">{employeeName(e)}</div>
                    <div className="text-sm text-fg-muted">
                      {findById(positions?.items, e.positionId)?.title ?? t("employee")}
                    </div>
                    <Button
                      component={Link}
                      to={`/employee/${e.id}/dashboard`}
                      variant="contained"
                      fullWidth
                      endIcon={<ArrowRight className="size-4" />}
                      sx={{ mt: 3, borderRadius: 6 }}
                    >
                      {t("select.enter")}
                    </Button>
                  </Card>
                ))}
              </div>
            )
          }
        </QueryState>
      </div>
    </div>
  );
}
