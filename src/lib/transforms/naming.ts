import type { DataRow, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Naming Transforms — applies Title Case, trims whitespace, cleans chars
// ---------------------------------------------------------------------------

/**
 * Convert a string to Title Case.
 * Each word is capitalised, with common short words lowercased unless first.
 */
function toTitleCase(str: string): string {
  const lowerWords = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor',
    'on', 'at', 'to', 'by', 'of', 'in', 'is',
  ]);

  return str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx === 0 || !lowerWords.has(lower)) {
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return lower;
    })
    .join(' ');
}

/**
 * Apply naming convention fixes to data rows based on validation issues.
 *
 * For each naming_convention issue that has a suggestedValue, the fix is
 * applied. If no suggestedValue is present, a Title Case conversion is
 * applied with whitespace trimming and special character removal.
 *
 * @param data   - The data rows to fix (a new array is returned)
 * @param issues - Validation issues from the naming conventions rule
 * @returns A new array of data rows with fixes applied
 */
export function applyNamingFixes(
  data: DataRow[],
  issues: ValidationIssue[],
): DataRow[] {
  const namingIssues = issues.filter((i) => i.category === 'naming_convention');

  if (namingIssues.length === 0) return data;

  // Build a map: row -> column -> suggested fix
  const fixMap = new Map<number, Map<string, string>>();
  for (const issue of namingIssues) {
    let fixes = fixMap.get(issue.row);
    if (!fixes) {
      fixes = new Map();
      fixMap.set(issue.row, fixes);
    }

    if (issue.suggestedValue !== undefined && issue.suggestedValue !== null) {
      fixes.set(issue.column, String(issue.suggestedValue));
    } else if (typeof issue.currentValue === 'string') {
      // Fallback: apply Title Case + cleanup
      const cleaned = issue.currentValue
        .replace(/[^a-zA-Z0-9\s\-'.,&()/]/g, '')
        .trim()
        .replace(/\s+/g, ' ');
      fixes.set(issue.column, toTitleCase(cleaned));
    }
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
