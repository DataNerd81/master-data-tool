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
 * Only the minority/anomalous fuel type rows are flagged — not every row.
 * For example, if a rego has 10 diesel rows and 1 petrol row, only the
 * 1 petrol row is flagged for review. The dominant fuel type is assumed
 * to be correct.
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

  // Build maps in a single pass: rego → distinct fuel types, row indices, and fuel counts
  const regoFuelTypes = new Map<string, Set<string>>();
  const regoRows = new Map<string, number[]>();
  const regoFuelCounts = new Map<string, Map<string, number>>();

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
      regoFuelCounts.set(regoStr, new Map());
    }
    regoFuelTypes.get(regoStr)!.add(fuelStr);
    regoRows.get(regoStr)!.push(i);

    const counts = regoFuelCounts.get(regoStr)!;
    counts.set(fuelStr, (counts.get(fuelStr) ?? 0) + 1);
  }

  // Only flag minority/anomalous fuel type rows — not every row for a mixed rego.
  for (const [rego, fuelTypes] of regoFuelTypes) {
    if (fuelTypes.size <= 1) continue;

    const counts = regoFuelCounts.get(rego)!;
    const fuelList = Array.from(fuelTypes).join(', ');
    const rows = regoRows.get(rego) ?? [];

    // Find the dominant fuel type (most common for this rego)
    let dominantFuel = '';
    let dominantCount = 0;
    for (const [fuel, count] of counts) {
      if (count > dominantCount) {
        dominantCount = count;
        dominantFuel = fuel;
      }
    }

    for (const rowIdx of rows) {
      const row = data[rowIdx];
      const fuelType = row[fuelTypeCol];
      const fuelStr = fuelType ? String(fuelType).trim().toLowerCase() : '';

      // Skip rows that match the dominant fuel type — they're most likely correct
      if (fuelStr === dominantFuel) continue;

      const product = row[productCol] ?? row[fuelTypeCol] ?? '';

      issues.push({
        id: `mixed-fuel-${rowIdx}`,
        row: rowIdx,
        column: fuelTypeCol,
        severity: 'warning',
        category: 'auto_detected',
        message: `Rego "${String(row[regoCol])}" has mixed fuel types (${fuelList}) — this row differs from the usual "${dominantFuel}"`,
        currentValue: String(product),
      });
    }
  }

  return issues;
}
