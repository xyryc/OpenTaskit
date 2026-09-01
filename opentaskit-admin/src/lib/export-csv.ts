export interface CsvColumn<T> {
  key: keyof T | ((row: T) => string | number | boolean | null | undefined);
  label: string;
}

export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[]
) {
  if (!rows || rows.length === 0) {
    alert("No records available to export.");
    return;
  }

  const headerRow = columns
    .map((col) => `"${col.label.replace(/"/g, '""')}"`)
    .join(",");

  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        let val: any;
        if (typeof col.key === "function") {
          val = col.key(row);
        } else {
          val = row[col.key];
        }

        if (val === null || val === undefined) {
          return '""';
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
