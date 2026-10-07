import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Курсы Нацбанка Таджикистана: nbt.tj не отдаёт CORS-заголовки, поэтому локально ходим через прокси.
// В продакшене укажите свой прокси в VITE_RATES_URL (см. src/shared/api/rates.js).
const proxy = {
  "/nbt-rates": {
    target: "https://nbt.tj",
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/nbt-rates/, "/ru/kurs/export_xml.php"),
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    open: true,
    proxy,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Библиотеки — отдельными файлами: после обновления кода сервиса браузер не скачивает их заново
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\/](react|react-dom|scheduler|react-router)[\/]/.test(id)) return "vendor-react";
          if (/[\/](@mui|@emotion)[\/]/.test(id)) return "vendor-mui";
          if (/[\/](@reduxjs|redux|react-redux|immer|reselect)[\/]/.test(id)) return "vendor-redux";
          if (/[\/](i18next|react-i18next)[\/]/.test(id)) return "vendor-i18n";
        },
      },
    },
  },
  preview: { proxy },
});
