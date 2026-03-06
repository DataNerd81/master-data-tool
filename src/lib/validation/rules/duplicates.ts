import type { DataRow, TemplateSchema, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Duplicates Rule — checks unique constraint columns for duplicate rows
// ---------------------------------------------------------------------------

/**
 * Build a composite key from a row based on the unique constraint columns.
 */
function buildKey(row: DataRow, columns: string[]): string {
  return columns
    .map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return '<<null>>';
      return String(val).trim().toLowerCase();
    })
    .join('|||');
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

  // Report all duplicate groups
  for (const [key, rowIndices] of seen) {
    if (rowIndices.length <= 1) continue;

    // Report an issue for each duplicate row (after the first occurrence)
    for (let i = 1; i < rowIndices.length; i++) {
      const rowIdx = rowIndices[i];
      const displayValues = constraintCols
        .map((col) => `${col}="${data[rowIdx][col] ?? ''}"`)
        .join(', ');

      issues.push({
        id: `dup-${rowIdx}-${constraintCols[0]}`,
        row: rowIdx,
        column: keyLabel,
        severity: 'critical',
        category: 'duplicate',
        message: `Duplicate row (${displayValues}) — first seen at row ${rowIndices[0] + 1}`,
        currentValue: key,
      });
    }
  }

  return issues;
}
