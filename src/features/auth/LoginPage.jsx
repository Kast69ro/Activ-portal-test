/**
 * Страница входа. Маршрут: /login. Доступ: публичная (вошедших перенаправляет дальше).
 */
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useLoginMutation } from "@/entities/users/usersApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { loggedIn, selectIsAuthenticated } from "@/shared/model/auth";
import { AuthLayout } from "./AuthLayout";

export default function LoginPage() {
  const { t } = useTranslation("auth");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [login, { isLoading, error }] = useLoginMutation();

  const [form, setForm] = useState({ userName: "", password: "" });
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname ?? "/"} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!form.userName.trim() || !form.password) return;
    try {
      const data = await login({ userName: form.userName.trim(), password: form.password }).unwrap();
      dispatch(loggedIn(data));
      navigate(location.state?.from?.pathname ?? "/", { replace: true });
    } catch {
      /* ошибка показана под формой */
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <AuthLayout title={t("login.title")} subtitle={t("login.subtitle")}>
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <TextField
          label={t("fields.userName")}
          value={form.userName}
          onChange={set("userName")}
          autoComplete="username"
          autoFocus
          required
          size="medium"
          error={touched && !form.userName.trim()}
          helperText={touched && !form.userName.trim() ? t("common:fields.required") : " "}
        />
        <TextField
          label={t("fields.password")}
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={set("password")}
          autoComplete="current-password"
          required
          size="medium"
          error={touched && !form.password}
          helperText={touched && !form.password ? t("common:fields.required") : " "}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    aria-label={t("fields.showPassword")}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {error && (
          <Alert severity="error">
            {error.status === 401 ? t("login.invalid") : getErrorMessage(error, t("login.failed"))}
          </Alert>
        )}

        <Button type="submit" variant="contained" size="large" loading={isLoading}>
          {t("login.submit")}
        </Button>
        <p className="text-center text-xs text-fg-muted">{t("login.hint")}</p>
      </form>
    </AuthLayout>
  );
}
