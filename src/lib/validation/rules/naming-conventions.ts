import type { DataRow, TemplateSchema, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Naming Convention Rule — checks text values for Title Case and formatting
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
    .replace(/\s+/g, ' ') // collapse multiple spaces
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
 * Check text columns for naming convention violations:
 * - Not Title Case (for columns with transform: 'titleCase')
 * - Contains special characters other than hyphens and apostrophes
 * - Leading or trailing whitespace
 * - Double (or more) consecutive spaces
 */
export function checkNamingConventions(
  data: DataRow[],
  schema: TemplateSchema,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Identify text columns that should follow naming conventions
  const textCols = schema.columns.filter(
    (c) => c.type === 'text' && c.transform === 'titleCase',
  );

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];

    for (const col of textCols) {
      const value = row[col.name];
      if (value === null || value === undefined) continue;
      if (typeof value !== 'string') continue;
      if (value.trim() === '') continue;

      const strVal = value;

      // Check for leading/trailing whitespace
      if (strVal !== strVal.trim()) {
        issues.push({
          id: `name-ws-${rowIdx}-${col.name}`,
          row: rowIdx,
          column: col.name,
          severity: 'warning',
          category: 'naming_convention',
          message: `"${col.name}" has leading or trailing whitespace`,
          currentValue: strVal,
          suggestedValue: strVal.trim(),
        });
      }

      // Check for double spaces
      if (/\s{2,}/.test(strVal)) {
        issues.push({
          id: `name-dblspc-${rowIdx}-${col.name}`,
          row: rowIdx,
          column: col.name,
          severity: 'warning',
          category: 'naming_convention',
          message: `"${col.name}" contains double spaces`,
          currentValue: strVal,
          suggestedValue: strVal.replace(/\s{2,}/g, ' '),
        });
      }

      // Check for special characters (allow letters, numbers, spaces, hyphens, apostrophes, periods, commas, ampersands, parentheses)
      const disallowed = strVal.replace(/[a-zA-Z0-9\s\-'.,&()/]/g, '');
      if (disallowed.length > 0) {
        const cleaned = strVal.replace(/[^a-zA-Z0-9\s\-'.,&()/]/g, '');
        issues.push({
          id: `name-special-${rowIdx}-${col.name}`,
          row: rowIdx,
          column: col.name,
          severity: 'warning',
          category: 'naming_convention',
          message: `"${col.name}" contains special characters: ${disallowed}`,
          currentValue: strVal,
          suggestedValue: toTitleCase(cleaned),
        });
      }

      // Check Title Case compliance
      const trimmed = strVal.trim().replace(/\s{2,}/g, ' ');
      const titleCased = toTitleCase(trimmed);
      if (trimmed !== titleCased) {
        // Avoid duplicate issues if already flagged above
        const alreadyFlagged = issues.some(
          (i) => i.row === rowIdx && i.column === col.name,
        );
        if (!alreadyFlagged) {
          issues.push({
            id: `name-case-${rowIdx}-${col.name}`,
            row: rowIdx,
            column: col.name,
            severity: 'warning',
            category: 'naming_convention',
            message: `"${col.name}" is not in Title Case`,
            currentValue: strVal,
            suggestedValue: titleCased,
          });
        }
      }
    }
  }

  return issues;
}
