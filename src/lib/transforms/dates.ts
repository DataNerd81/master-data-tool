import type { DataRow, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Date Transforms — converts dates to dd/mm/yyyy format
// ---------------------------------------------------------------------------

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
 * Apply date format fixes to data rows based on validation issues.
 *
 * For each date_format issue that has a suggestedValue, the value is
 * replaced. Date objects in the data are also formatted to dd/mm/yyyy
 * strings for consistency.
 *
 * @param data   - The data rows to fix (a new array is returned)
 * @param issues - Validation issues from the date formats rule
 * @returns A new array of data rows with fixes applied
 */
export function applyDateFixes(
  data: DataRow[],
  issues: ValidationIssue[],
): DataRow[] {
  const dateIssues = issues.filter((i) => i.category === 'date_format');

  // Build a fix map: row -> column -> formatted date string
  const fixMap = new Map<number, Map<string, string>>();

  for (const issue of dateIssues) {
    if (issue.suggestedValue === undefined || issue.suggestedValue === null) {
      continue;
    }

    let fixes = fixMap.get(issue.row);
    if (!fixes) {
      fixes = new Map();
      fixMap.set(issue.row, fixes);
    }

    fixes.set(issue.column, String(issue.suggestedValue));
  }

  // Apply fixes, also converting any remaining Date objects
  return data.map((row, rowIdx) => {
    const rowFixes = fixMap.get(rowIdx);
    const newRow = { ...row };

    // Apply explicit fixes from validation issues
    if (rowFixes) {
      for (const [col, fixedValue] of rowFixes) {
        newRow[col] = fixedValue;
      }
    }

    // Also convert any Date objects in the row to dd/mm/yyyy strings
    for (const [key, value] of Object.entries(newRow)) {
      if (value instanceof Date && !isNaN(value.getTime())) {
        // Don't overwrite if already fixed above
        if (!rowFixes?.has(key)) {
          newRow[key] = formatDDMMYYYY(value);
        }
      }
    }

    return newRow;
  });
}
