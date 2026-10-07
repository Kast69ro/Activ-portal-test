import { env } from "@/config/env";
import { baseApi } from "./baseApi";

/**
 * Официальные курсы Национального банка Таджикистана (nbt.tj) к сомони.
 *
 * НБТ отдаёт XML без CORS-заголовков, поэтому браузер не может запросить его напрямую:
 *   — при разработке запросы идут через прокси Vite (/nbt-rates → nbt.tj, см. vite.config.js);
 *   — в продакшене укажите в VITE_RATES_URL адрес прокси на бэкенде, который передаёт
 *     параметры ?date=YYYY-MM-DD&export=xmlout на https://nbt.tj/ru/kurs/export_xml.php
 */
export const RATE_CODES = ["USD", "EUR", "RUB"];

const isoDate = (date) => date.toISOString().slice(0, 10);

/** XML НБТ → { date, rates: { USD: 9.2262, ... } } — курс за 1 единицу валюты */
function parseNbtXml(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const root = doc.querySelector("ValCurs");
  if (!root) throw new Error("Unexpected NBT response");

  const rates = {};
  for (const node of doc.querySelectorAll("Valute")) {
    const code = node.querySelector("CharCode")?.textContent.trim();
    const nominal = Number(node.querySelector("Nominal")?.textContent) || 1;
    const value = Number(node.querySelector("Value")?.textContent.replace(",", "."));
    if (code && Number.isFinite(value)) rates[code] = value / nominal;
  }
  return { date: root.getAttribute("Date"), rates };
}

async function fetchDay(date) {
  const response = await fetch(`${env.ratesUrl}?date=${isoDate(date)}&export=xmlout`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseNbtXml(await response.text());
}

const ratesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNbtRates: build.query({
      queryFn: async () => {
        try {
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);

          const [current, previous] = await Promise.all([fetchDay(today), fetchDay(yesterday)]);

          return {
            data: {
              date: current.date,
              rates: RATE_CODES.filter((code) => current.rates[code] != null).map((code) => ({
                code,
                value: current.rates[code],
                change: current.rates[code] - (previous.rates[code] ?? current.rates[code]),
              })),
            },
          };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: String(error.message ?? error) } };
        }
      },
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const { useGetNbtRatesQuery } = ratesApi;
