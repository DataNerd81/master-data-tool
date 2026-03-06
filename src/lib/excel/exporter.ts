import * as XLSX from 'xlsx';
import type { DataRow, TemplateSchema, CellValue } from '@/types';

// ---------------------------------------------------------------------------
// Excel Exporter — creates styled Excel workbooks and triggers download
// ---------------------------------------------------------------------------

/** KubeNest brand blue for header backgrounds */
const KUBENEST_BLUE = '003399';

/**
 * Format a CellValue for Excel output.
 * Dates are formatted as dd/mm/yyyy strings for consistency.
 */
function formatCellForExport(value: CellValue): string | number | boolean {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return value;
}

/**
 * Export data to an Excel file with schema-based column ordering,
 * styled headers (bold, KubeNest blue background, white text),
 * and auto-width columns. Triggers a browser download.
 *
 * @param data      - The data rows to export
 * @param schema    - The template schema defining column order
 * @param fileName  - Optional filename (defaults to "schema-name-export.xlsx")
 */
export function exportToExcel(
  data: DataRow[],
  schema: TemplateSchema,
  fileName?: string,
): void {
  // Determine column order: schema columns first, then any extra columns
  const schemaColNames = schema.columns.map((c) => c.name);
  const allKeys = new Set<string>();
  for (const row of data) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }
  const extraCols = Array.from(allKeys).filter(
    (k) => !schemaColNames.includes(k),
  );
  const orderedColumns = [...schemaColNames, ...extraCols];

  // Build the sheet data as an array of arrays
  const sheetData: (string | number | boolean)[][] = [];

  // Header row
  sheetData.push(orderedColumns);

  // Data rows
  for (const row of data) {
    const rowValues = orderedColumns.map((col) =>
      formatCellForExport(row[col]),
    );
    sheetData.push(rowValues);
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Apply header styles
  for (let c = 0; c < orderedColumns.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cellRef]) continue;
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: KUBENEST_BLUE } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  // Calculate auto-width for each column
  const colWidths: XLSX.ColInfo[] = orderedColumns.map((col, idx) => {
    let maxWidth = col.length;
    for (const row of data) {
      const val = row[col];
      const strLen = val != null ? String(val).length : 0;
      if (strLen > maxWidth) maxWidth = strLen;
    }
    // Add padding and cap at reasonable max
    return { wch: Math.min(maxWidth + 3, 60) };
  });
  ws['!cols'] = colWidths;

  // Create workbook and append the sheet
  const wb = XLSX.utils.book_new();
  const safeSheetName = schema.name.replace(/[:\\/?*[\]]/g, '-').slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  // Generate the file name
  const safeName =
    fileName ||
    `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.xlsx`;

  // Trigger browser download
  XLSX.writeFile(wb, safeName);
}
