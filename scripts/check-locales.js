// Проверяет, что во всех языках одинаковый набор ключей перевода.
// Запуск: npm run i18n:check
import fs from "node:fs";
import path from "node:path";

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

const dirs = [
  "src/shared/i18n/locales",
  ...fs.readdirSync("src/features").map((f) => `src/features/${f}/locales`),
].filter((d) => fs.existsSync(d));

let errors = 0;

for (const dir of dirs) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const keys = Object.fromEntries(
    files.map((f) => [
      path.basename(f, ".json"),
      new Set(flatten(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))),
    ]),
  );
  const all = new Set(Object.values(keys).flatMap((s) => [...s]));

  for (const [lng, set] of Object.entries(keys)) {
    for (const key of all) {
      if (!set.has(key)) {
        console.error(`✗ ${dir}/${lng}.json: нет ключа "${key}"`);
        errors++;
      }
    }
  }
}

if (errors) process.exit(1);
console.log(`✓ Переводы согласованы (${dirs.length} пространств имён)`);
