import type { DataRow, TemplateSchema, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Required Fields Rule — checks that all required columns have values
// ---------------------------------------------------------------------------

/**
 * Validate that every required column in the schema has a non-empty value
 * in every data row. Empty strings, null, and undefined are all treated
 * as missing values.
 */
export function checkRequiredFields(
  data: DataRow[],
  schema: TemplateSchema,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const requiredCols = schema.columns.filter((c) => c.required);

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];

    for (const col of requiredCols) {
      const value = row[col.name];

      const isMissing =
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '');

      if (isMissing) {
        issues.push({
          id: `req-${rowIdx}-${col.name}`,
          row: rowIdx,
          column: col.name,
          severity: 'critical',
          category: 'required_fields',
          message: `Required field "${col.name}" is empty`,
          currentValue: value ?? null,
          suggestedValue: col.defaultValue ?? undefined,
        });
      }
    }
  }

  return issues;
}
