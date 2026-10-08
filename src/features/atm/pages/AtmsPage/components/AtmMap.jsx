/**
 * Карта банкоматов (Leaflet + OpenStreetMap): можно скрыть или открыть на весь экран.
 * Точки — из статического списка адресов (model/atmLocations.js). Используется только в AtmsPage.
 */
import { useEffect, useState } from "react";
import { EyeOff, Map as MapIcon, Maximize2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { ATM_LOCATIONS, MAP_CENTER } from "@/features/atm/model/atmLocations";

// Иконки маркеров Leaflet по умолчанию ищет по относительным путям — после сборки Vite их там нет
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

/** Leaflet не замечает изменения размера контейнера (свернули меню, открыли на весь экран) — подсказываем */
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function AtmMapView() {
  const { t } = useTranslation("atm");

  return (
    <MapContainer center={MAP_CENTER} zoom={12} className="size-full">
      <AutoResize />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {ATM_LOCATIONS.map((a) => (
        <Marker key={a.id} position={[a.lat, a.lng]} opacity={a.approx ? 0.6 : 1}>
          <Popup>
            <div className="min-w-48">
              <div className="font-extrabold">{t("map.atm")}</div>
              <div className="mt-1">
                {a.region}, {a.address}
              </div>
              {a.approx && <div className="mt-2 text-xs opacity-70">{t("map.approx")}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export function AtmMap() {
  const { t } = useTranslation("atm");
  const [hidden, setHidden] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 font-bold">
          <MapIcon className="size-4.5 text-brand-600" />
          {t("map.title")}
          <span className="text-sm font-medium text-fg-muted">{t("map.count", { count: ATM_LOCATIONS.length })}</span>
        </div>
        <div className="flex gap-2">
          {!hidden && (
            <Button size="small" startIcon={<Maximize2 className="size-4" />} onClick={() => setFullscreen(true)}>
              {t("map.fullscreen")}
            </Button>
          )}
          <Button
            size="small"
            color="inherit"
            startIcon={hidden ? <MapIcon className="size-4" /> : <EyeOff className="size-4" />}
            onClick={() => setHidden((v) => !v)}
          >
            {t(hidden ? "map.show" : "map.hide")}
          </Button>
        </div>
      </div>

      {/* Скрытую карту не монтируем; isolate — чтобы слои Leaflet (z-index 400+) не перекрывали шапку и меню */}
      {!hidden && !fullscreen && (
        <div className="relative isolate h-[40vh] border-t border-line">
          <AtmMapView />
        </div>
      )}

      <Dialog fullScreen open={fullscreen} onClose={() => setFullscreen(false)}>
        <div className="relative isolate size-full">
          <AtmMapView />
          <Tooltip title={t("map.exitFullscreen")}>
            <IconButton
              onClick={() => setFullscreen(false)}
              sx={{ position: "absolute", top: 12, right: 12, zIndex: 1000, bgcolor: "background.paper", boxShadow: 2, "&:hover": { bgcolor: "background.paper" } }}
            >
              <X className="size-5" />
            </IconButton>
          </Tooltip>
        </div>
      </Dialog>
    </Card>
  );
}
