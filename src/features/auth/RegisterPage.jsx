import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useLoginMutation, useRegisterMutation } from "@/entities/users/usersApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { loggedIn } from "@/shared/model/auth";
import { AuthLayout } from "./AuthLayout";

const FIELDS = ["firstName", "lastName", "email", "userName", "phoneNumber"];

export default function RegisterPage() {
  const { t } = useTranslation("auth");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, registerState] = useRegisterMutation();
  const [login, loginState] = useLoginMutation();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userName: "",
    phoneNumber: "+992",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState(false);

  const mismatch = form.confirmPassword && form.password !== form.confirmPassword;
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!form.password || !form.confirmPassword || mismatch) return;
    try {
      await register({ ...form, roleId: "" }).unwrap();
      const data = await login({ userName: form.userName, password: form.password }).unwrap();
      dispatch(loggedIn(data));
      navigate("/", { replace: true });
    } catch {
      /* ошибка показана под формой */
    }
  };

  const error = registerState.error ?? loginState.error;

  return (
    <AuthLayout title={t("register.title")} subtitle={t("register.subtitle")} width={480}>
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-2 gap-x-3 gap-y-4">
        {FIELDS.map((field) => (
          <TextField
            key={field}
            label={t(`fields.${field}`)}
            value={form[field]}
            onChange={set(field)}
            className={field === "firstName" || field === "lastName" ? "" : "col-span-2"}
            slotProps={field === "phoneNumber" ? { htmlInput: { maxLength: 13 } } : undefined}
          />
        ))}
        <TextField
          label={t("fields.password")}
          type="password"
          required
          value={form.password}
          onChange={set("password")}
          error={touched && !form.password}
        />
        <TextField
          label={t("fields.confirmPassword")}
          type="password"
          required
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          error={Boolean(mismatch) || (touched && !form.confirmPassword)}
          helperText={mismatch ? t("register.mismatch") : undefined}
        />

        {error && (
          <Alert severity="error" className="col-span-2">
            {getErrorMessage(error, t("register.failed"))}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          className="col-span-2"
          loading={registerState.isLoading || loginState.isLoading}
        >
          {t("register.submit")}
        </Button>
        <p className="col-span-2 text-center text-sm text-fg-muted">
          {t("register.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-brand-600">
            {t("login.submit")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
