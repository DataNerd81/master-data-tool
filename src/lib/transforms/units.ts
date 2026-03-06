import type { DataRow, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Unit Transforms — standardises unit strings
// ---------------------------------------------------------------------------

/**
 * Apply unit corrections to data rows based on validation issues.
 *
 * For each unit issue that has a suggestedValue, the value is replaced
 * with the standardised unit string.
 *
 * @param data   - The data rows to fix (a new array is returned)
 * @param issues - Validation issues from the units rule
 * @returns A new array of data rows with fixes applied
 */
export function applyUnitFixes(
  data: DataRow[],
  issues: ValidationIssue[],
): DataRow[] {
  const unitIssues = issues.filter((i) => i.category === 'unit');

  if (unitIssues.length === 0) return data;

  // Build a map: row -> column -> corrected unit
  const fixMap = new Map<number, Map<string, string>>();
  for (const issue of unitIssues) {
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

  // Apply fixes, creating new row objects
  return data.map((row, rowIdx) => {
    const rowFixes = fixMap.get(rowIdx);
    if (!rowFixes) return row;

    const newRow = { ...row };
    for (const [col, fixedValue] of rowFixes) {
      newRow[col] = fixedValue;
    }
    return newRow;
  });
}
