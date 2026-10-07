/**
 * Диалог «Частые вопросы» — открывается из шапки (Topbar).
 */
import { ChevronDown, CircleHelp } from "lucide-react";
import { useTranslation } from "react-i18next";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { brand } from "@/config/brand";

/** Руководство по базе знаний — вопросы и ответы из common:faq.items */
export function FaqDialog({ open, onClose }) {
  const { t } = useTranslation();
  const items = t("faq.items", { returnObjects: true, email: brand.supportEmail });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircleHelp className="size-6 text-brand-600" />
        {t("faq.title")}
      </DialogTitle>
      <DialogContent dividers>
        {Array.isArray(items) &&
          items.map((item, i) => (
            <Accordion key={i} disableGutters elevation={0} sx={{ "&::before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ChevronDown className="size-4" />}>
                <span className="font-semibold">
                  {i + 1}. {item.q}
                </span>
              </AccordionSummary>
              <AccordionDetails sx={{ color: "text.secondary", pt: 0 }}>{item.a}</AccordionDetails>
            </Accordion>
          ))}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="contained" onClick={onClose}>
          {t("actions.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
