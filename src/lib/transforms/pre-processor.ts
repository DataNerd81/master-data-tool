import type { DataRow, CellValue, ParsedSheet } from '@/types';

// ---------------------------------------------------------------------------
// Pre-Processor — cleans messy fuel-card-style spreadsheets before mapping
//
// Handles patterns like:
//   Row 97:  "Card no 7071 3400 9049 3809 Rego CH76CU Name"  (section header)
//   Row 98:  11/06/2024 | E65956 | Ampol Foodary | Premium Diesel A | 67.14
//   Row 99:  28/06/2024 | E22080 | Ampol Heatherbrae | Premium Diesel A | 49.39
//   Row 100: 29/06/2024 |        | Periodic Card Fee |                  | 2.00
//   Row 101: 30/06/2024 |        | Total for Card no 7071 ...          | 116.53
//   Row 102: "Card no 7071 3400 9049 3833 Rego CJ98LW Name"  (next section)
// ---------------------------------------------------------------------------

/**
 * Regex to extract rego/asset from merged section header rows.
 * Matches patterns like:
 * - "Card no 7071 3400 9049 3809 Rego CH76CU Name"
 * - "Rego: ABC123"
 * - "Registration: 1ABC234"
 * - "Asset No: FLT-0042"
 */
const REGO_EXTRACTION_PATTERNS: RegExp[] = [
  /\bRego\s*:?\s*([A-Z0-9][-A-Z0-9]{2,10})\b/i,
  /\bRegistration\s*(?:No\.?|Number)?\s*:?\s*([A-Z0-9][-A-Z0-9]{2,10})\b/i,
  /\bAsset\s*(?:No\.?|Number|ID)?\s*:?\s*([A-Z0-9][-A-Z0-9]{2,10})\b/i,
  /\bVehicle\s*(?:No\.?|Number|ID)?\s*:?\s*([A-Z0-9][-A-Z0-9]{2,10})\b/i,
  /\bFleet\s*(?:No\.?|Number|ID)?\s*:?\s*([A-Z0-9][-A-Z0-9]{2,10})\b/i,
];

/**
 * Patterns that indicate a row should be skipped (totals, fees, subtotals, headers).
 */
const JUNK_ROW_PATTERNS: RegExp[] = [
  /\btotal\s*(for|:)/i,
  /\bsubtotal\b/i,
  /\bgrand\s*total\b/i,
  /\bperiodic\s*card\s*fee\b/i,
  /\bcard\s*fee\b\s*\$/i,
  /\bcard\s*fees?\b/i,
  /^CARD\s*FEES$/i,
  /\baccount\s*fee\b/i,
  /\badmin\s*(fee|charge)\b/i,
  /\bservice\s*(fee|charge)\b/i,
  /\bmonthly\s*(fee|charge)\b/i,
  // Statement/invoice chrome
  /\bclosing\s*balance\b/i,
  /\bopening\s*balance\b/i,
  /\baccount\s*no\b/i,
  /\btax\s*invoice\b/i,
  /\bpage\s+\d+\s*(of\s*\d+)?/i,
  /\btotal\s*excl\s*gst/i,
  /\btotal\s*inc\s*gst/i,
  /\bgst\s*amount\b/i,
  /\btotal\s*for\s*card\b/i,
  /\bcard\s*transactions\b/i,
  // Column-header-like rows that repeat mid-sheet
  /\bcard\s*details.*location\b/i,
];

/**
 * Patterns that indicate a row is a section header (contains rego info
 * but is not a data row itself).
 */
const SECTION_HEADER_PATTERNS: RegExp[] = [
  /\bCard\s*no\b.*\bRego\b/i,
  /\bCard\s*number\b.*\bRego\b/i,
  /^Rego\s*:?\s*[A-Z0-9]/i,
  /^Registration\b/i,
  /^Asset\s*(No|Number|ID)\b/i,
  /^Vehicle\s*(No|Number|ID)\b/i,
];

/**
 * Try to extract a rego/asset number from a text string.
 * Returns null if no rego is found.
 */
export function extractRego(text: string): string | null {
  if (!text || typeof text !== 'string') return null;

  for (const pattern of REGO_EXTRACTION_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Check if a row's text content indicates it's a section header
 * (the merged row containing rego info).
 */
function isSectionHeader(row: DataRow): boolean {
  const allText = getAllRowText(row);
  return SECTION_HEADER_PATTERNS.some((p) => p.test(allText));
}

/**
 * Check if a row appears to be a junk row (total, fee, etc).
 */
function isJunkRow(row: DataRow): boolean {
  const allText = getAllRowText(row);
  if (JUNK_ROW_PATTERNS.some((p) => p.test(allText))) return true;

  // Check if any individual cell is a standalone "Total" (summary row)
  for (const val of Object.values(row)) {
    if (typeof val === 'string' && /^\s*total\s*$/i.test(val)) return true;
  }

  return false;
}

/**
 * Concatenate all text values from a row into a single string for pattern matching.
 */
function getAllRowText(row: DataRow): string {
  return Object.values(row)
    .filter((v) => v !== null && v !== undefined)
    .map((v) => String(v))
    .join(' ');
}

/**
 * Check if a row has meaningful numeric data (i.e. at least one number
 * that looks like a quantity, not just a row number).
 */
function hasNumericData(row: DataRow): boolean {
  let numericCount = 0;
  for (const val of Object.values(row)) {
    if (typeof val === 'number' && val > 0) {
      numericCount++;
    }
  }
  return numericCount >= 1;
}

// ---------------------------------------------------------------------------
// Date extraction / propagation
// ---------------------------------------------------------------------------

/**
 * Patterns to detect standalone date rows like:
 *   "Date 31/05/2023"
 *   "Date: 01-06-2023"
 *   "Date 31/05/2023  Tax invoice no  0109588226"
 *
 * Returns the date string if found, otherwise null.
 */
const DATE_ROW_PATTERNS: RegExp[] = [
  /\bDate\s*:?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
];

/**
 * Try to extract a standalone date from a row.
 * These rows appear in fuel card statements as "Date 31/05/2023" and contain
 * the transaction date for the block of transactions below.
 */
function extractStandaloneDate(row: DataRow): string | null {
  const allText = getAllRowText(row);

  for (const pattern of DATE_ROW_PATTERNS) {
    const match = allText.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  // Also check individual cell values for Date objects or date-like values
  for (const val of Object.values(row)) {
    if (val instanceof Date) {
      const d = val.getDate().toString().padStart(2, '0');
      const m = (val.getMonth() + 1).toString().padStart(2, '0');
      const y = val.getFullYear();
      return `${d}/${m}/${y}`;
    }
  }

  return null;
}

/**
 * Check if a row is primarily a date/page header row (not a transaction row).
 * These rows contain "Date XX/XX/XXXX" + optional "Tax invoice no" / "page X of Y"
 * but no fuel transaction data.
 */
function isDateHeaderRow(row: DataRow): boolean {
  const allText = getAllRowText(row);
  // Must contain "Date DD/MM/YYYY" pattern
  if (!/\bDate\s*:?\s*\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/i.test(allText)) return false;
  // Should also contain statement chrome like "Tax invoice", "Account no", "page"
  // OR have very few non-empty cells (date-only rows)
  const nonEmpty = Object.values(row).filter(
    (v) => v !== null && v !== undefined && v !== '',
  ).length;
  if (nonEmpty <= 4) return true;
  if (/\btax\s*invoice\b/i.test(allText)) return true;
  if (/\baccount\s*no\b/i.test(allText)) return true;
  if (/\bpage\b/i.test(allText)) return true;
  return false;
}

/**
 * Find the date column in headers — the column where dates should go.
 */
function findDateColumn(headers: string[]): string | null {
  const datePatterns = [
    /^date$/i, /\bdate\b/i, /\btransaction\s*date\b/i,
    /\bpurchase\s*date\b/i, /\bfill\s*date\b/i,
  ];
  for (const header of headers) {
    for (const pattern of datePatterns) {
      if (pattern.test(header.trim())) {
        return header;
      }
    }
  }
  return null;
}

/**
 * Check if the sheet headers contain a unit column.
 */
function findUnitColumn(headers: string[]): string | null {
  const unitPatterns = [
    /^unit/i, /\buom\b/i, /unit\s*of\s*measure/i,
    /^litres$/i, /^liters$/i, /^kl$/i, /^measure/i,
  ];

  for (const header of headers) {
    for (const pattern of unitPatterns) {
      if (pattern.test(header.trim())) {
        return header;
      }
    }
  }

  return null;
}

/**
 * Detect if a column likely contains dates by checking the first few values.
 */
function looksLikeDateColumn(data: DataRow[], colName: string): boolean {
  let dateCount = 0;
  const sample = data.slice(0, 20);
  for (const row of sample) {
    const val = row[colName];
    if (val instanceof Date) {
      dateCount++;
    } else if (typeof val === 'string' && /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/.test(val)) {
      dateCount++;
    }
  }
  return dateCount >= 2;
}

// ---------------------------------------------------------------------------
// Main Pre-Processor
// ---------------------------------------------------------------------------

export interface PreProcessResult {
  /** The cleaned, flattened data rows ready for mapping */
  data: DataRow[];
  /** Updated headers (includes injected columns like Rego, Unit) */
  headers: string[];
  /** Summary of what was done */
  summary: {
    totalInputRows: number;
    outputRows: number;
    skippedJunkRows: number;
    skippedSectionHeaders: number;
    regosFound: string[];
    unitDefaulted: boolean;
  };
}

/**
 * Pre-process a messy fuel card spreadsheet.
 *
 * This is the main entry point. It:
 * 1. Scans for section header rows containing rego numbers
 * 2. Extracts regos and propagates them to transaction rows below
 * 3. Filters out junk rows (totals, fees, empty rows)
 * 4. Injects a "Rego/Asset Number/Identifier" column if one doesn't exist
 * 5. Defaults the unit to "L" if no unit column exists
 *
 * @param sheet - The parsed sheet from the Excel parser
 * @returns Pre-processed data ready for the mapping step
 */
export function preProcessFuelData(sheet: ParsedSheet): PreProcessResult {
  const { headers, data } = sheet;

  const regosFound: string[] = [];
  let currentRego: string | null = null;
  let currentDate: string | null = null;
  let skippedJunkRows = 0;
  let skippedSectionHeaders = 0;

  const hasUnitCol = findUnitColumn(headers) !== null;
  const dateCol = findDateColumn(headers);
  const cleanRows: DataRow[] = [];

  // Check if there's already a rego-like column in headers
  const regoColPatterns = [
    /rego/i, /registration/i, /asset\s*(no|number|id)/i,
    /vehicle\s*(no|number|id)/i, /fleet\s*(no|number|id)/i,
  ];
  const existingRegoCol = headers.find((h) =>
    regoColPatterns.some((p) => p.test(h)),
  );

  for (const row of data) {
    const allText = getAllRowText(row);

    // Check if this row is a date/page header (e.g. "Date 31/05/2023  Tax invoice no")
    if (isDateHeaderRow(row)) {
      const date = extractStandaloneDate(row);
      if (date) {
        currentDate = date;
      }
      skippedJunkRows++;
      continue;
    }

    // Check if this row is a section header with a rego
    if (isSectionHeader(row)) {
      const rego = extractRego(allText);
      if (rego) {
        currentRego = rego;
        if (!regosFound.includes(rego)) {
          regosFound.push(rego);
        }
      }
      skippedSectionHeaders++;
      continue;
    }

    // Check if this row is a junk row (totals, fees)
    if (isJunkRow(row)) {
      skippedJunkRows++;
      continue;
    }

    // Skip rows with no meaningful data
    if (!hasNumericData(row)) {
      // But first check if this row has a standalone date we should capture
      const date = extractStandaloneDate(row);
      if (date) {
        currentDate = date;
      }
      continue;
    }

    // Also try to extract rego from any cell in this row (for non-sectioned data)
    if (!currentRego && !existingRegoCol) {
      const rego = extractRego(allText);
      if (rego) {
        currentRego = rego;
        if (!regosFound.includes(rego)) {
          regosFound.push(rego);
        }
      }
    }

    // Build the clean row
    const cleanRow: DataRow = { ...row };

    // Inject rego if we have one and there's no rego column
    if (!existingRegoCol && currentRego) {
      cleanRow['Rego/Asset Number/Identifier'] = currentRego;
    }

    // Propagate date to transaction rows that don't have one.
    // In fuel card statements the date often appears in a separate header
    // row like "Date 31/05/2023" above the transaction block.
    if (currentDate && dateCol) {
      const existingDate = cleanRow[dateCol];
      if (existingDate === null || existingDate === undefined || existingDate === '') {
        cleanRow[dateCol] = currentDate;
      }
    }

    // Default unit to "L" if no unit column exists
    if (!hasUnitCol) {
      cleanRow['Unit'] = 'L';
    }

    cleanRows.push(cleanRow);
  }

  // Build updated headers
  const updatedHeaders = [...headers];
  if (!existingRegoCol && regosFound.length > 0) {
    updatedHeaders.unshift('Rego/Asset Number/Identifier');
  }
  if (!hasUnitCol) {
    updatedHeaders.push('Unit');
  }

  return {
    data: cleanRows,
    headers: updatedHeaders,
    summary: {
      totalInputRows: data.length,
      outputRows: cleanRows.length,
      skippedJunkRows,
      skippedSectionHeaders,
      regosFound,
      unitDefaulted: !hasUnitCol,
    },
  };
}
