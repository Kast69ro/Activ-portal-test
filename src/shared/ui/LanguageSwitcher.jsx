import { useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Button from "@mui/material/Button";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { LANGUAGES } from "@/shared/i18n/languages";
import { selectLanguage, setLanguage } from "@/shared/model/settings";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const language = useSelector(selectLanguage);
  const [anchor, setAnchor] = useState(null);
  const current = LANGUAGES.find((l) => l.code === language);

  return (
    <>
      <Button
        color="inherit"
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label={t("topbar.language")}
        startIcon={<Globe className="size-4" />}
        endIcon={<ChevronDown className="size-3.5" />}
        sx={{ color: "text.secondary", minWidth: 0 }}
      >
        {current?.short}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {LANGUAGES.map((l) => (
          <MenuItem
            key={l.code}
            selected={l.code === language}
            onClick={() => {
              dispatch(setLanguage(l.code));
              setAnchor(null);
            }}
          >
            <ListItemText primary={l.label} secondary={l.short} />
            <ListItemIcon sx={{ justifyContent: "flex-end", color: "primary.main" }}>
              {l.code === language && <Check className="size-4" />}
            </ListItemIcon>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
