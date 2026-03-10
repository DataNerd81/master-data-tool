import type { DataRow, TemplateSchema, CellValue } from '@/types';

// ---------------------------------------------------------------------------
// Deduplication Transform — removes duplicate rows
// ---------------------------------------------------------------------------

/**
 * Normalise a cell value for consistent comparison.
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
 * Build a composite key from a row based on the given columns.
 */
function buildKey(row: DataRow, columns: string[]): string {
  return columns.map((col) => normaliseValue(row[col])).join('|||');
}

/**
 * Remove duplicate rows from the data based on the schema's unique
 * constraint columns. The first occurrence of each unique key is kept.
 *
 * If no uniqueConstraint is defined in the schema, data is returned
 * unchanged.
 *
 * @param data   - The data rows to deduplicate
 * @param schema - The template schema with unique constraint definition
 * @returns A new array with duplicates removed
 */
export function applyDeduplication(
  data: DataRow[],
  schema: TemplateSchema,
): DataRow[] {
  if (!schema.uniqueConstraint || schema.uniqueConstraint.length === 0) {
    return data;
  }

  const constraintCols = schema.uniqueConstraint;
  const seen = new Set<string>();
  const result: DataRow[] = [];

  for (const row of data) {
    const key = buildKey(row, constraintCols);

    // Keep rows where all constraint columns are empty (can't determine uniqueness)
    const allEmpty = key === Array(constraintCols.length).fill('<<null>>').join('|||');
    if (allEmpty) {
      result.push(row);
      continue;
    }

    if (!seen.has(key)) {
      seen.add(key);
      result.push(row);
    }
    // Duplicate rows are silently dropped
  }

  return result;
}
