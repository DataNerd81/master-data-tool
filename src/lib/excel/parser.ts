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
 * Known column-name patterns used to identify the real header row in messy
 * sheets.  Each pattern corresponds to a common fuel-data column name or alias.
 */
const HEADER_KEYWORD_PATTERNS: RegExp[] = [
  // Date
  /^date$/i, /\bdate\b/i, /\btransaction\s*date\b/i,
  // Product / Fuel
  /^product$/i, /\bproduct\b/i, /\bfuel\b/i, /\bdescription\b/i,
  // Quantity
  /^quantity$/i, /\bquantity\b/i, /\bqty\b/i, /\bvolume\b/i, /\blitres\b/i,
  // Location / Card details
  /\blocation\b/i, /\bcard\s*details\b/i, /\bsite\b/i,
  // Transaction / Odometer
  /\btransaction\b/i, /\bodometer\b/i,
  // Rego / Asset
  /\brego\b/i, /\basset\b/i, /\bregistration\b/i, /\bvehicle\b/i,
  // Totals / GST (common in fuel card statements)
  /\btotal\s*excl\b/i, /\btotal\s*inc\b/i, /\bgst\b/i,
];

/**
 * Score a row to see how many cells match known header keywords.
 * Returns the count of distinct header keywords matched.
 */
function scoreHeaderRow(
  ws: XLSX.WorkSheet,
  row: number,
  colStart: number,
  colEnd: number,
): number {
  let matches = 0;
  const seen = new Set<number>(); // track which patterns matched to avoid double-counting

  for (let c = colStart; c <= colEnd; c++) {
    const addr = `${colIndexToLetter(c)}${row + 1}`;
    const cell = ws[addr] as XLSX.CellObject | undefined;
    if (!cell || cell.v == null) continue;
    const text = String(cell.v).trim();
    if (!text || text.length > 60) continue; // headers are short text

    for (let i = 0; i < HEADER_KEYWORD_PATTERNS.length; i++) {
      if (!seen.has(i) && HEADER_KEYWORD_PATTERNS[i].test(text)) {
        seen.add(i);
        matches++;
        break; // one match per cell is enough
      }
    }
  }

  return matches;
}

/**
 * Scan the first N rows of a worksheet to find the real header row.
 * Returns the 0-based row index of the best candidate, or the range start
 * row if no strong match is found.
 *
 * A row needs at least 3 keyword matches to be considered a header row.
 * This handles messy fuel card statements where 80+ junk rows precede
 * the actual column headers.
 */
function findHeaderRow(
  ws: XLSX.WorkSheet,
  range: XLSX.Range,
  maxScan: number = 150,
): number {
  const lastRow = Math.min(range.s.r + maxScan, range.e.r);
  let bestRow = range.s.r;
  let bestScore = 0;

  for (let r = range.s.r; r <= lastRow; r++) {
    const score = scoreHeaderRow(ws, r, range.s.c, range.e.c);
    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
    }
  }

  // Only use the detected header row if it has at least 3 keyword matches
  // (otherwise the sheet probably has normal headers in row 1)
  return bestScore >= 3 ? bestRow : range.s.r;
}

/**
 * Parse a single worksheet into a ParsedSheet, handling merged cells.
 *
 * Uses smart header detection to find the real header row in messy
 * fuel card statement sheets where junk rows precede the actual data.
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

  // Find the real header row (may not be row 1 in messy sheets)
  const headerRow = findHeaderRow(ws, range);

  // Extract headers from the detected header row
  const headers: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = `${colIndexToLetter(c)}${headerRow + 1}`;
    const cell = ws[addr] as XLSX.CellObject | undefined;
    const headerVal = cell?.v != null ? String(cell.v).trim() : `Column_${c + 1}`;
    headers.push(headerVal);
  }

  // Extract data rows (starting from the row after the header)
  const data: DataRow[] = [];
  for (let r = headerRow + 1; r <= range.e.r; r++) {
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
