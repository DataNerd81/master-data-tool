import type { DataRow, TemplateSchema, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Data Type Rule — validates column values match expected types
// ---------------------------------------------------------------------------

/**
 * Check that column values match the expected data types defined in the schema:
 * - number columns should have numeric values
 * - boolean columns should have true/false values
 * - enum columns should have values from the allowed set
 */
export function checkDataTypes(
  data: DataRow[],
  schema: TemplateSchema,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];

    for (const col of schema.columns) {
      const value = row[col.name];

      // Skip null/undefined/empty — those are handled by required-fields rule
      if (value === null || value === undefined) continue;
      if (typeof value === 'string' && value.trim() === '') continue;

      switch (col.type) {
        case 'number':
          checkNumberType(value, col.name, rowIdx, col, issues);
          break;
        case 'boolean':
          checkBooleanType(value, col.name, rowIdx, issues);
          break;
        case 'enum':
          checkEnumType(value, col.name, rowIdx, col.allowedValues || [], issues);
          break;
        // text and date types are handled by other rules
      }
    }
  }

  return issues;
}

function checkNumberType(
  value: unknown,
  colName: string,
  rowIdx: number,
  col: { validation?: { min?: number; max?: number } },
  issues: ValidationIssue[],
): void {
  let numVal: number;

  if (typeof value === 'number') {
    numVal = value;
  } else if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '')); // handle comma-separated numbers
    if (isNaN(parsed)) {
      issues.push({
        id: `dtype-num-${rowIdx}-${colName}`,
        row: rowIdx,
        column: colName,
        severity: 'critical',
        category: 'data_type',
        message: `"${colName}" expects a number but got "${value}"`,
        currentValue: value,
      });
      return;
    }
    numVal = parsed;
  } else {
    issues.push({
      id: `dtype-num-${rowIdx}-${colName}`,
      row: rowIdx,
      column: colName,
      severity: 'critical',
      category: 'data_type',
      message: `"${colName}" expects a number but got type ${typeof value}`,
      currentValue: value as string,
    });
    return;
  }

  // Range validation
  const validation = col.validation;
  if (validation?.min !== undefined && numVal < validation.min) {
    issues.push({
      id: `dtype-min-${rowIdx}-${colName}`,
      row: rowIdx,
      column: colName,
      severity: 'warning',
      category: 'data_type',
      message: `"${colName}" value ${numVal} is below minimum ${validation.min}`,
      currentValue: numVal,
      suggestedValue: validation.min,
    });
  }
  if (validation?.max !== undefined && numVal > validation.max) {
    issues.push({
      id: `dtype-max-${rowIdx}-${colName}`,
      row: rowIdx,
      column: colName,
      severity: 'warning',
      category: 'data_type',
      message: `"${colName}" value ${numVal} is above maximum ${validation.max}`,
      currentValue: numVal,
      suggestedValue: validation.max,
    });
  }
}

function checkBooleanType(
  value: unknown,
  colName: string,
  rowIdx: number,
  issues: ValidationIssue[],
): void {
  if (typeof value === 'boolean') return;

  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    const truthy = ['true', 'yes', 'y', '1'];
    const falsy = ['false', 'no', 'n', '0'];

    if (truthy.includes(lower)) {
      issues.push({
        id: `dtype-bool-${rowIdx}-${colName}`,
        row: rowIdx,
        column: colName,
        severity: 'warning',
        category: 'data_type',
        message: `"${colName}" has a close boolean match "${value}" — should be true`,
        currentValue: value,
        suggestedValue: true,
      });
    } else if (falsy.includes(lower)) {
      issues.push({
        id: `dtype-bool-${rowIdx}-${colName}`,
        row: rowIdx,
        column: colName,
        severity: 'warning',
        category: 'data_type',
        message: `"${colName}" has a close boolean match "${value}" — should be false`,
        currentValue: value,
        suggestedValue: false,
      });
    } else {
      issues.push({
        id: `dtype-bool-${rowIdx}-${colName}`,
        row: rowIdx,
        column: colName,
        severity: 'critical',
        category: 'data_type',
        message: `"${colName}" expects a boolean but got "${value}"`,
        currentValue: value,
      });
    }
  } else if (typeof value === 'number') {
    if (value === 1 || value === 0) {
      issues.push({
        id: `dtype-bool-${rowIdx}-${colName}`,
        row: rowIdx,
        column: colName,
        severity: 'warning',
        category: 'data_type',
        message: `"${colName}" has numeric boolean ${value} — converting to ${Boolean(value)}`,
        currentValue: value,
        suggestedValue: Boolean(value),
      });
    } else {
      issues.push({
        id: `dtype-bool-${rowIdx}-${colName}`,
        row: rowIdx,
        column: colName,
        severity: 'critical',
        category: 'data_type',
        message: `"${colName}" expects a boolean but got number ${value}`,
        currentValue: value,
      });
    }
  }
}

function checkEnumType(
  value: unknown,
  colName: string,
  rowIdx: number,
  allowedValues: string[],
  issues: ValidationIssue[],
): void {
  const strVal = String(value).trim();

  // Exact match (case-insensitive)
  const exactMatch = allowedValues.find(
    (av) => av.toLowerCase() === strVal.toLowerCase(),
  );

  if (exactMatch) {
    // If the case doesn't match exactly, suggest the correct casing
    if (exactMatch !== strVal) {
      issues.push({
        id: `dtype-enum-${rowIdx}-${colName}`,
        row: rowIdx,
        column: colName,
        severity: 'warning',
        category: 'data_type',
        message: `"${colName}" value "${strVal}" should be "${exactMatch}" (case mismatch)`,
        currentValue: strVal,
        suggestedValue: exactMatch,
      });
    }
    return;
  }

  // No match found
  issues.push({
    id: `dtype-enum-${rowIdx}-${colName}`,
    row: rowIdx,
    column: colName,
    severity: 'critical',
    category: 'data_type',
    message: `"${colName}" value "${strVal}" is not one of: ${allowedValues.join(', ')}`,
    currentValue: strVal,
  });
}
