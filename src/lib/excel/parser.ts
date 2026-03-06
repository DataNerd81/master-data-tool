import * as XLSX from 'xlsx';
import type { ParsedWorkbook, ParsedSheet, DataRow, CellValue } from '@/types';

// ---------------------------------------------------------------------------
// Excel Parser — reads Excel files into ParsedWorkbook structures
// ---------------------------------------------------------------------------

/**
 * Convert an Excel serial date number to a JavaScript Date.
 * Excel serial dates count from 1900-01-01 (with a leap-year bug for 1900).
 */
function excelSerialToDate(serial: number): Date {
  // Excel incorrectly treats 1900 as a leap year; serials > 59 need adjustment
  const adjusted = serial > 59 ? serial - 1 : serial;
  const epoch = new Date(1899, 11, 31); // Dec 31, 1899
  return new Date(epoch.getTime() + adjusted * 86400000);
}

/**
 * Determine whether a cell value looks like an Excel date serial number.
 * Checks if the cell format from the workbook is a date format.
 */
function isDateCell(cell: XLSX.CellObject | undefined): boolean {
  if (!cell || cell.t !== 'n') return false;
  // SheetJS marks date cells with t === 'd' when cellDates is true,
  // but we also look at the number format to catch edge cases
  const fmt = cell.z != null ? String(cell.z) : '';
  const dateFmtPatterns = [
    /[dmyhs]/i, // contains day, month, year, hour, second tokens
    /\d{4}/, // year-like patterns in format
  ];
  return dateFmtPatterns.some((p) => p.test(fmt));
}

/**
 * Convert a raw SheetJS cell value to a typed CellValue.
 */
function convertCellValue(
  cell: XLSX.CellObject | undefined,
): CellValue {
  if (!cell) return null;

  switch (cell.t) {
    case 's': // string
      return cell.v as string;
    case 'n': // number
      // If the cell has a date format, convert to a Date object
      if (isDateCell(cell)) {
        return excelSerialToDate(cell.v as number);
      }
      return cell.v as number;
    case 'b': // boolean
      return cell.v as boolean;
    case 'd': // date (when cellDates option is used)
      return new Date(cell.v as string);
    case 'e': // error
      return null;
    case 'z': // stub (empty)
      return null;
    default:
      return cell.v != null ? String(cell.v) : null;
  }
}

/**
 * Decode a column index (0-based) into an Excel column letter (A, B, ..., Z, AA, ...).
 */
function colIndexToLetter(index: number): string {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/**
 * Parse a single worksheet into a ParsedSheet, handling merged cells.
 */
function parseSheet(
  ws: XLSX.WorkSheet,
  sheetName: string,
): ParsedSheet {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  // Handle merged cells by propagating values from the top-left cell
  const merges = ws['!merges'] || [];
  for (const merge of merges) {
    const topLeftAddr = XLSX.utils.encode_cell({
      r: merge.s.r,
      c: merge.s.c,
    });
    const topLeftCell = ws[topLeftAddr];

    for (let r = merge.s.r; r <= merge.e.r; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        if (r === merge.s.r && c === merge.s.c) continue; // skip the source cell
        const addr = XLSX.utils.encode_cell({ r, c });
        if (topLeftCell) {
          ws[addr] = { ...topLeftCell };
        }
      }
    }
  }

  // Extract headers from the first row
  const headers: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = `${colIndexToLetter(c)}${range.s.r + 1}`;
    const cell = ws[addr] as XLSX.CellObject | undefined;
    const headerVal = cell?.v != null ? String(cell.v).trim() : `Column_${c + 1}`;
    headers.push(headerVal);
  }

  // Extract data rows (starting from row 2)
  const data: DataRow[] = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row: DataRow = {};
    let hasData = false;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = `${colIndexToLetter(c)}${r + 1}`;
      const cell = ws[addr] as XLSX.CellObject | undefined;
      const value = convertCellValue(cell);

      const header = headers[c - range.s.c];
      row[header] = value;

      if (value !== null && value !== undefined && value !== '') {
        hasData = true;
      }
    }

    // Only include rows that have at least one non-empty value
    if (hasData) {
      data.push(row);
    }
  }

  return {
    name: sheetName,
    headers,
    data,
    rowCount: data.length,
  };
}

/**
 * Parse an Excel file (File object) into a ParsedWorkbook.
 *
 * Uses SheetJS to read the binary content. Each sheet is parsed into
 * a ParsedSheet with headers, typed data rows, and merged cell handling.
 */
export async function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, {
    type: 'array',
    cellDates: false, // we handle date conversion ourselves
    cellStyles: false,
    cellNF: true, // preserve number formats for date detection
  });

  const sheets: ParsedSheet[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws || !ws['!ref']) continue; // skip empty sheets
    sheets.push(parseSheet(ws, sheetName));
  }

  return {
    fileName: file.name,
    sheets,
  };
}

/**
 * Return the first N rows of a sheet for preview purposes.
 */
export function getSheetPreview(
  sheet: ParsedSheet,
  maxRows: number = 5,
): DataRow[] {
  return sheet.data.slice(0, maxRows);
}
