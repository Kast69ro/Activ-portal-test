import { downloadFile } from "@/shared/lib/files";

/*
 * Выгрузка в Excel. exceljs тяжёлый (~1 МБ), поэтому грузится только при нажатии «Экспорт».
 *
 * sheets: [{ name, title?, columns: [{ header, width }], rows: [[...]] }]
 */
const BRAND = "FFE31E24";

export async function exportWorkbook(fileName, sheets) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Активбанк — HR-система";
  workbook.created = new Date();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name, { properties: { tabColor: { argb: BRAND } } });
    let headerRowNumber = 1;

    if (sheet.title) {
      ws.addRow([sheet.title]);
      ws.mergeCells(1, 1, 1, Math.max(2, sheet.columns.length));
      const title = ws.getRow(1);
      title.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
      title.alignment = { horizontal: "center", vertical: "middle" };
      title.height = 34;
      ws.addRow([]);
      headerRowNumber = 3;
    }

    const header = ws.addRow(sheet.columns.map((c) => c.header));
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B303C" } };
    header.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    header.height = 26;

    sheet.rows.forEach((row) => {
      const r = ws.addRow(row);
      r.alignment = { vertical: "middle", wrapText: true };
    });

    sheet.columns.forEach((c, i) => {
      ws.getColumn(i + 1).width = c.width ?? 18;
    });
    if (sheet.rows.length) {
      ws.autoFilter = {
        from: { row: headerRowNumber, column: 1 },
        to: { row: headerRowNumber + sheet.rows.length, column: sheet.columns.length },
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadFile(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
