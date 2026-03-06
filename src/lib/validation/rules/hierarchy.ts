import type { DataRow, TemplateSchema, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Hierarchy Rule — validates parent references, orphans, circular refs
// ---------------------------------------------------------------------------

/**
 * If the schema defines a hierarchy, check:
 * 1. All parent references point to existing records
 * 2. No orphaned records (non-root items without a valid parent)
 * 3. No circular references in the parent chain
 */
export function checkHierarchy(
  data: DataRow[],
  schema: TemplateSchema,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!schema.hierarchy || !schema.hierarchy.parentColumn) {
    return issues;
  }

  const parentCol = schema.hierarchy.parentColumn;
  // Use the first column in the hierarchy levels as the name/identifier column
  // or fall back to the first schema column
  const nameCol =
    schema.columns.find((c) => c.name === schema.hierarchy!.levels[0])?.name ||
    schema.columns[0]?.name;

  if (!nameCol) return issues;

  // Build a set of all known record names (using the name column)
  // We'll look for any column that could serve as the primary identifier
  // Prefer 'Location Name', 'Asset Name', etc. — the first required text column
  const identifierCol =
    schema.columns.find((c) => c.required && c.type === 'text')?.name ||
    schema.columns[0]?.name;

  if (!identifierCol) return issues;

  const allNames = new Set<string>();
  for (const row of data) {
    const name = row[identifierCol];
    if (name !== null && name !== undefined && String(name).trim() !== '') {
      allNames.add(String(name).trim().toLowerCase());
    }
  }

  // Build parent lookup: recordName -> parentName
  const parentMap = new Map<string, string>();
  for (const row of data) {
    const name = row[identifierCol];
    const parent = row[parentCol];
    if (name !== null && name !== undefined && String(name).trim() !== '') {
      const nameStr = String(name).trim().toLowerCase();
      if (parent !== null && parent !== undefined && String(parent).trim() !== '') {
        parentMap.set(nameStr, String(parent).trim().toLowerCase());
      }
    }
  }

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    const parentValue = row[parentCol];

    // Skip rows without a parent (they are root-level)
    if (parentValue === null || parentValue === undefined) continue;
    const parentStr = String(parentValue).trim();
    if (parentStr === '') continue;

    const parentLower = parentStr.toLowerCase();

    // Check 1: Parent reference exists in the data
    if (!allNames.has(parentLower)) {
      issues.push({
        id: `hier-orphan-${rowIdx}-${parentCol}`,
        row: rowIdx,
        column: parentCol,
        severity: 'warning',
        category: 'hierarchy',
        message: `Parent "${parentStr}" not found in data — orphaned record`,
        currentValue: parentStr,
      });
      continue;
    }

    // Check 2: Circular reference detection
    const name = row[identifierCol];
    if (name === null || name === undefined) continue;
    const nameLower = String(name).trim().toLowerCase();

    const visited = new Set<string>();
    let current = nameLower;
    let isCircular = false;

    while (current) {
      if (visited.has(current)) {
        isCircular = true;
        break;
      }
      visited.add(current);
      current = parentMap.get(current) || '';
    }

    if (isCircular) {
      issues.push({
        id: `hier-circ-${rowIdx}-${parentCol}`,
        row: rowIdx,
        column: parentCol,
        severity: 'warning',
        category: 'hierarchy',
        message: `Circular reference detected: "${String(name).trim()}" -> "${parentStr}" forms a cycle`,
        currentValue: parentStr,
      });
    }
  }

  return issues;
}
