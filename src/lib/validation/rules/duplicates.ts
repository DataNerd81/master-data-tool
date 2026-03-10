import type { DataRow, TemplateSchema, ValidationIssue, CellValue } from '@/types';

// ---------------------------------------------------------------------------
// Duplicates Rule — checks unique constraint columns for duplicate rows
// ---------------------------------------------------------------------------

/**
 * Normalise a cell value for consistent comparison.
 * - Dates → dd/mm/yyyy string
 * - Numbers → rounded to 4 decimal places
 * - Everything else → trimmed lowercase string
 */
function normaliseValue(val: CellValue): string {
  if (val === null || val === undefined) return '<<null>>';

  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${val.getFullYear()}`;
  }

  if (typeof val === 'number') {
    return String(Math.round(val * 10000) / 10000);
  }

  return String(val).trim().toLowerCase();
}

/**
 * Build a composite key from a row based on the unique constraint columns.
 */
function buildKey(row: DataRow, columns: string[]): string {
  return columns.map((col) => normaliseValue(row[col])).join('|||');
}

/**
 * Check for duplicate rows based on the schema's uniqueConstraint columns.
 * If no uniqueConstraint is defined, this rule is skipped.
 */
export function checkDuplicates(
  data: DataRow[],
  schema: TemplateSchema,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!schema.uniqueConstraint || schema.uniqueConstraint.length === 0) {
    return issues;
  }

  const constraintCols = schema.uniqueConstraint;
  const keyLabel = constraintCols.join(' + ');

  // Map from composite key -> list of row indices
  const seen = new Map<string, number[]>();

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const key = buildKey(data[rowIdx], constraintCols);

    // Skip rows where all constraint columns are empty
    if (key === Array(constraintCols.length).fill('<<null>>').join('|||')) {
      continue;
    }

    const existing = seen.get(key);
    if (existing) {
      existing.push(rowIdx);
    } else {
      seen.set(key, [rowIdx]);
    }
  }

  // Report all duplicate groups — flag EVERY row in the group so the user
  // can see the full pair/set side by side in the Duplicate Data tab.
  for (const [key, rowIndices] of seen) {
    if (rowIndices.length <= 1) continue;

    for (let i = 0; i < rowIndices.length; i++) {
      const rowIdx = rowIndices[i];
      const displayValues = constraintCols
        .map((col) => `${col}="${data[rowIdx][col] ?? ''}"`)
        .join(', ');

      const otherRows = rowIndices
        .filter((_, j) => j !== i)
        .map((r) => r + 1)
        .join(', ');

      issues.push({
        id: `dup-${rowIdx}-${constraintCols[0]}`,
        row: rowIdx,
        column: keyLabel,
        severity: 'critical',
        category: 'duplicate',
        message: `Duplicate row (${displayValues}) — also at row${rowIndices.length > 2 ? 's' : ''} ${otherRows}`,
        currentValue: key,
      });
    }
  }

  return issues;
}
