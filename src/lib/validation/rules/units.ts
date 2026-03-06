import type { DataRow, TemplateSchema, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Units Rule — standardises unit strings to Australian/SI conventions
// ---------------------------------------------------------------------------

/**
 * Map of common non-standard unit strings to their standardised equivalents.
 * Keys are lowercase for case-insensitive matching.
 */
const UNIT_CORRECTIONS: Record<string, string> = {
  // Volume
  liters: 'litres',
  liter: 'litre',
  'l': 'L',
  gallons: 'gallons (US)', // flag for clarity
  // Mass
  tons: 'tonnes',
  ton: 'tonne',
  'metric tons': 'tonnes',
  'metric ton': 'tonne',
  kilograms: 'kg',
  kilogram: 'kg',
  grams: 'g',
  gram: 'g',
  // Energy
  kwh: 'kWh',
  'kw/h': 'kWh',
  'kilowatt hours': 'kWh',
  'kilowatt-hours': 'kWh',
  'kilowatt hour': 'kWh',
  mwh: 'MWh',
  'megawatt hours': 'MWh',
  'megawatt-hours': 'MWh',
  gwh: 'GWh',
  'gigawatt hours': 'GWh',
  gj: 'GJ',
  mj: 'MJ',
  // Area
  'square meters': 'sqm',
  'square metres': 'sqm',
  'm2': 'sqm',
  'sq m': 'sqm',
  'square feet': 'sqft',
  'sq ft': 'sqft',
  'ft2': 'sqft',
  // Temperature
  celsius: '\u00B0C',
  fahrenheit: '\u00B0F',
  'degrees c': '\u00B0C',
  'degrees f': '\u00B0F',
  'deg c': '\u00B0C',
  'deg f': '\u00B0F',
  // Emissions
  'kg co2': 'kg CO2-e',
  'kg co2e': 'kg CO2-e',
  'kg co2-e': 'kg CO2-e',
  'tonnes co2': 't CO2-e',
  'tonnes co2e': 't CO2-e',
  't co2': 't CO2-e',
  't co2e': 't CO2-e',
  't co2-e': 't CO2-e',
  // Distance
  kilometers: 'km',
  kilometres: 'km',
  meters: 'm',
  metres: 'm',
};

/**
 * Identify columns that are likely to contain unit values.
 * Heuristic: columns with "unit" in their name/aliases, or columns
 * whose allowedValues include known units.
 */
function getUnitColumns(schema: TemplateSchema): string[] {
  const unitColNames: string[] = [];

  for (const col of schema.columns) {
    const nameLower = col.name.toLowerCase();
    const aliasesLower = col.aliases.map((a) => a.toLowerCase());

    const isUnitCol =
      nameLower.includes('unit') ||
      nameLower.includes('uom') ||
      nameLower.includes('measure') ||
      aliasesLower.some(
        (a) =>
          a.includes('unit') || a.includes('uom') || a.includes('measure'),
      );

    if (isUnitCol) {
      unitColNames.push(col.name);
    }
  }

  return unitColNames;
}

/**
 * Check unit columns for non-standard unit strings and suggest corrections.
 */
export function checkUnits(
  data: DataRow[],
  schema: TemplateSchema,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const unitCols = getUnitColumns(schema);

  // If no obvious unit columns, also check all text columns for unit-like values
  const colsToCheck =
    unitCols.length > 0
      ? unitCols
      : schema.columns.filter((c) => c.type === 'text').map((c) => c.name);

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];

    for (const colName of colsToCheck) {
      const value = row[colName];
      if (value === null || value === undefined) continue;
      if (typeof value !== 'string') continue;

      const trimmed = value.trim();
      if (trimmed === '') continue;

      const lower = trimmed.toLowerCase();
      const correction = UNIT_CORRECTIONS[lower];

      if (correction && correction !== trimmed) {
        issues.push({
          id: `unit-${rowIdx}-${colName}`,
          row: rowIdx,
          column: colName,
          severity: 'warning',
          category: 'unit',
          message: `"${colName}" unit "${trimmed}" should be "${correction}"`,
          currentValue: trimmed,
          suggestedValue: correction,
        });
      }
    }
  }

  return issues;
}
