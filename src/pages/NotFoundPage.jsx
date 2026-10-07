import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <div className="text-7xl font-extrabold tracking-tighter text-brand-600">404</div>
        <h1 className="mt-3 text-xl font-bold">{t("notFound.title")}</h1>
        <p className="mt-1 text-fg-muted">{t("notFound.text")}</p>
        <Button component={Link} to="/" variant="contained" sx={{ mt: 3 }}>
          {t("notFound.home")}
        </Button>
      </div>
    </div>
  );
}
