import type { DataRow, TemplateSchema, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Date Format Rule — validates dates and normalises to dd/mm/yyyy
// ---------------------------------------------------------------------------

const TARGET_FORMAT = 'dd/mm/yyyy';

/**
 * Detect whether a string looks like a US-format date (mm/dd/yyyy).
 */
function isLikelyUSDate(str: string): boolean {
  // mm/dd/yyyy or mm-dd-yyyy
  const match = str.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (!match) return false;
  const [, first, second] = match;
  const firstNum = parseInt(first, 10);
  const secondNum = parseInt(second, 10);
  // If first > 12, it can't be a month, so it's likely dd/mm
  // If second > 12, first must be the month (US format)
  if (secondNum > 12 && firstNum <= 12) return true;
  // Ambiguous cases: if both <= 12, we default to assuming Australian dd/mm
  return false;
}

/**
 * Detect whether a string is in ISO format (yyyy-mm-dd).
 */
function isISODate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(str);
}

/**
 * Format a Date object as dd/mm/yyyy.
 */
function formatDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Attempt to parse a date string in various formats and return a Date.
 * Returns null if the string cannot be parsed.
 */
function parseDate(value: string): { date: Date; format: string } | null {
  const trimmed = value.trim();

  // ISO format: yyyy-mm-dd
  if (isISODate(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return { date, format: 'yyyy-mm-dd (ISO)' };
    }
  }

  // Try dd/mm/yyyy or dd-mm-yyyy
  const dmyMatch = trimmed.match(
    /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/,
  );
  if (dmyMatch) {
    const [, dayOrMonth, monthOrDay, year] = dmyMatch;
    const first = parseInt(dayOrMonth, 10);
    const second = parseInt(monthOrDay, 10);
    const y = parseInt(year, 10);

    if (isLikelyUSDate(trimmed)) {
      // US format: mm/dd/yyyy
      const date = new Date(y, first - 1, second);
      if (!isNaN(date.getTime()) && date.getDate() === second) {
        return { date, format: 'mm/dd/yyyy (US)' };
      }
    }

    // Australian/UK format: dd/mm/yyyy
    const date = new Date(y, second - 1, first);
    if (!isNaN(date.getTime()) && date.getDate() === first) {
      return { date, format: 'dd/mm/yyyy' };
    }

    // Fallback: try as US if AU parse failed
    const fallback = new Date(y, first - 1, second);
    if (!isNaN(fallback.getTime()) && fallback.getDate() === second) {
      return { date: fallback, format: 'mm/dd/yyyy (US)' };
    }
  }

  // Try Date.parse as last resort
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return { date: parsed, format: 'other' };
  }

  return null;
}

/**
 * Check all date columns for valid dates and correct formatting.
 * Suggests conversion to dd/mm/yyyy format.
 */
export function checkDateFormats(
  data: DataRow[],
  schema: TemplateSchema,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dateCols = schema.columns.filter((c) => c.type === 'date');

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];

    for (const col of dateCols) {
      const value = row[col.name];
      if (value === null || value === undefined) continue;

      // Already a Date object — check if it needs reformatting
      if (value instanceof Date) {
        if (isNaN(value.getTime())) {
          issues.push({
            id: `date-invalid-${rowIdx}-${col.name}`,
            row: rowIdx,
            column: col.name,
            severity: 'warning',
            category: 'date_format',
            message: `"${col.name}" contains an invalid date`,
            currentValue: String(value),
          });
        }
        // Valid Date object — no issue (will be formatted on export)
        continue;
      }

      const strVal = String(value).trim();
      if (strVal === '') continue;

      // Check if already in target format dd/mm/yyyy
      const targetMatch = strVal.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (targetMatch) {
        const [, d, m, y] = targetMatch;
        const testDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        if (
          testDate.getDate() === parseInt(d) &&
          testDate.getMonth() === parseInt(m) - 1
        ) {
          continue; // Already in correct format and valid
        }
      }

      // Try to parse the date
      const result = parseDate(strVal);

      if (!result) {
        issues.push({
          id: `date-invalid-${rowIdx}-${col.name}`,
          row: rowIdx,
          column: col.name,
          severity: 'warning',
          category: 'date_format',
          message: `"${col.name}" value "${strVal}" is not a valid date`,
          currentValue: strVal,
        });
        continue;
      }

      // Valid date but not in target format
      const formatted = formatDDMMYYYY(result.date);
      if (strVal !== formatted) {
        issues.push({
          id: `date-fmt-${rowIdx}-${col.name}`,
          row: rowIdx,
          column: col.name,
          severity: 'warning',
          category: 'date_format',
          message: `"${col.name}" date in ${result.format} format — convert to ${TARGET_FORMAT}`,
          currentValue: strVal,
          suggestedValue: formatted,
        });
      }
    }
  }

  return issues;
}
