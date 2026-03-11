import type { DataRow, TemplateSchema, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Mixed Fuel Types Rule — flags regos that have multiple different fuel types
// ---------------------------------------------------------------------------

/**
 * Check for regos/assets that have more than one distinct fuel type.
 *
 * A single vehicle should typically use one fuel type. If the same rego
 * appears with both "Diesel" and "V-Power" (petrol), either the rego is
 * wrong or the fuel type was incorrectly recorded.
 *
 * Issues are reported with category 'auto_detected' so they appear in the
 * Unsure / N/A tab for user review.
 */
export function checkMixedFuelTypes(
  data: DataRow[],
  _schema: TemplateSchema,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const regoCol = 'Rego/Asset Number/Identifier';
  const fuelTypeCol = 'Fuel Type (NGA)';
  const productCol = 'Products used/Fuel type';

  // Build a map: rego → Set of distinct NGA fuel types
  const regoFuelTypes = new Map<string, Set<string>>();
  // Also track which rows belong to each rego
  const regoRows = new Map<string, number[]>();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rego = row[regoCol];
    if (!rego) continue;
    const regoStr = String(rego).trim().toLowerCase();
    if (!regoStr) continue;

    const fuelType = row[fuelTypeCol];
    if (!fuelType) continue;
    const fuelStr = String(fuelType).trim().toLowerCase();

    if (!regoFuelTypes.has(regoStr)) {
      regoFuelTypes.set(regoStr, new Set());
      regoRows.set(regoStr, []);
    }
    regoFuelTypes.get(regoStr)!.add(fuelStr);
    regoRows.get(regoStr)!.push(i);
  }

  // Flag all rows for regos that have more than one fuel type
  for (const [rego, fuelTypes] of regoFuelTypes) {
    if (fuelTypes.size <= 1) continue;

    const fuelList = Array.from(fuelTypes).join(', ');
    const rows = regoRows.get(rego) ?? [];

    for (const rowIdx of rows) {
      const row = data[rowIdx];
      const product = row[productCol] ?? row[fuelTypeCol] ?? '';

      issues.push({
        id: `mixed-fuel-${rowIdx}`,
        row: rowIdx,
        column: fuelTypeCol,
        severity: 'warning',
        category: 'auto_detected',
        message: `Rego "${String(row[regoCol])}" has mixed fuel types (${fuelList}) — check if rego or fuel type is incorrect`,
        currentValue: String(product),
      });
    }
  }

  return issues;
}
