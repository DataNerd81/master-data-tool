import type { DataRow, TemplateSchema, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// Australian Formats Rule — ABN, postcodes, phone numbers
// ---------------------------------------------------------------------------

// ---- ABN Validation ----

/**
 * Validate an Australian Business Number using the official check-digit algorithm.
 *
 * ABN validation:
 * 1. Must be exactly 11 digits
 * 2. Subtract 1 from the first digit
 * 3. Multiply each digit by its weighting factor
 * 4. Sum the products — result must be divisible by 89
 */
const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

function isValidABN(abn: string): boolean {
  const digits = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(digits)) return false;

  const nums = digits.split('').map(Number);
  // Subtract 1 from the first digit
  nums[0] = nums[0] - 1;

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += nums[i] * ABN_WEIGHTS[i];
  }

  return sum % 89 === 0;
}

// ---- Australian Postcode Validation ----

/**
 * Valid postcode ranges per state/territory.
 * Source: Australia Post standards.
 */
const POSTCODE_RANGES: { state: string; min: number; max: number }[] = [
  { state: 'NSW', min: 2000, max: 2599 },
  { state: 'NSW', min: 2619, max: 2899 },
  { state: 'NSW', min: 2921, max: 2999 },
  { state: 'ACT', min: 2600, max: 2618 },
  { state: 'ACT', min: 2900, max: 2920 },
  { state: 'VIC', min: 3000, max: 3999 },
  { state: 'QLD', min: 4000, max: 4999 },
  { state: 'SA', min: 5000, max: 5799 },
  { state: 'WA', min: 6000, max: 6797 },
  { state: 'TAS', min: 7000, max: 7799 },
  { state: 'NT', min: 800, max: 899 },
];

function isValidAustralianPostcode(postcode: string): boolean {
  const digits = postcode.trim();
  if (!/^\d{4}$/.test(digits) && !/^\d{3}$/.test(digits)) return false; // NT has 3-digit base
  const num = parseInt(digits, 10);
  return POSTCODE_RANGES.some((r) => num >= r.min && num <= r.max);
}

function getStateForPostcode(postcode: string): string | null {
  const num = parseInt(postcode.trim(), 10);
  const match = POSTCODE_RANGES.find((r) => num >= r.min && num <= r.max);
  return match?.state ?? null;
}

// ---- Australian Phone Number Validation ----

/**
 * Validate Australian phone numbers.
 * Accepts: 02 xxxx xxxx, 04xx xxx xxx, +61 x xxxx xxxx, etc.
 */
function isValidAustralianPhone(phone: string): boolean {
  // Strip all whitespace, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // International format: +61xxxxxxxxx (9 digits after +61)
  if (/^\+61\d{9}$/.test(cleaned)) return true;

  // National format: 0x xxxxxxxx (10 digits starting with 0)
  if (/^0[2-478]\d{8}$/.test(cleaned)) return true;

  // Mobile: 04xx xxx xxx (10 digits starting with 04)
  if (/^04\d{8}$/.test(cleaned)) return true;

  return false;
}

/**
 * Format a phone number to a standard Australian format.
 */
function formatAustralianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Convert +61 to 0 prefix for display
  let national = cleaned;
  if (cleaned.startsWith('+61')) {
    national = '0' + cleaned.slice(3);
  }

  // Format as 04xx xxx xxx (mobile) or 0x xxxx xxxx (landline)
  if (national.startsWith('04') && national.length === 10) {
    return `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
  }
  if (national.length === 10) {
    return `${national.slice(0, 2)} ${national.slice(2, 6)} ${national.slice(6)}`;
  }

  return phone; // Return as-is if we can't format it
}

// ---- Main Rule ----

/**
 * Check Australian-specific formats: ABN, postcodes, and phone numbers.
 * Identifies relevant columns by name/alias pattern matching.
 */
export function checkAustralianFormats(
  data: DataRow[],
  schema: TemplateSchema,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Find ABN, postcode, and phone columns by name/alias
  const abnCols: string[] = [];
  const postcodeCols: string[] = [];
  const phoneCols: string[] = [];
  const stateCols: string[] = [];

  for (const col of schema.columns) {
    const lower = col.name.toLowerCase();
    const aliasLower = col.aliases.map((a) => a.toLowerCase());
    const allTerms = [lower, ...aliasLower];

    if (allTerms.some((t) => t.includes('abn') || t.includes('business number'))) {
      abnCols.push(col.name);
    }
    if (
      allTerms.some(
        (t) =>
          t.includes('postcode') ||
          t.includes('post code') ||
          t.includes('zip') ||
          t.includes('postal'),
      )
    ) {
      postcodeCols.push(col.name);
    }
    if (allTerms.some((t) => t.includes('phone') || t.includes('tel') || t.includes('mobile'))) {
      phoneCols.push(col.name);
    }
    if (
      allTerms.some(
        (t) => t === 'state' || t.includes('state') || t.includes('territory'),
      )
    ) {
      stateCols.push(col.name);
    }
  }

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];

    // Validate ABNs
    for (const colName of abnCols) {
      const value = row[colName];
      if (value === null || value === undefined) continue;
      const strVal = String(value).trim();
      if (strVal === '') continue;

      const cleanABN = strVal.replace(/\s/g, '');
      if (!/^\d{11}$/.test(cleanABN)) {
        issues.push({
          id: `au-abn-format-${rowIdx}-${colName}`,
          row: rowIdx,
          column: colName,
          severity: 'warning',
          category: 'australian_format',
          message: `ABN "${strVal}" is not 11 digits`,
          currentValue: strVal,
        });
      } else if (!isValidABN(cleanABN)) {
        issues.push({
          id: `au-abn-check-${rowIdx}-${colName}`,
          row: rowIdx,
          column: colName,
          severity: 'warning',
          category: 'australian_format',
          message: `ABN "${strVal}" fails check-digit validation`,
          currentValue: strVal,
        });
      }
    }

    // Validate postcodes
    for (const colName of postcodeCols) {
      const value = row[colName];
      if (value === null || value === undefined) continue;
      const strVal = String(value).trim();
      if (strVal === '') continue;

      if (!isValidAustralianPostcode(strVal)) {
        issues.push({
          id: `au-postcode-${rowIdx}-${colName}`,
          row: rowIdx,
          column: colName,
          severity: 'warning',
          category: 'australian_format',
          message: `Postcode "${strVal}" is not a valid Australian postcode`,
          currentValue: strVal,
        });
      } else if (stateCols.length > 0) {
        // Cross-check postcode against state if both columns exist
        const stateCol = stateCols[0];
        const stateValue = row[stateCol];
        if (stateValue) {
          const expectedState = getStateForPostcode(strVal);
          const actualState = String(stateValue).trim().toUpperCase();
          if (expectedState && expectedState !== actualState) {
            issues.push({
              id: `au-postcode-state-${rowIdx}-${colName}`,
              row: rowIdx,
              column: colName,
              severity: 'warning',
              category: 'australian_format',
              message: `Postcode "${strVal}" belongs to ${expectedState} but state is "${actualState}"`,
              currentValue: strVal,
            });
          }
        }
      }
    }

    // Validate phone numbers
    for (const colName of phoneCols) {
      const value = row[colName];
      if (value === null || value === undefined) continue;
      const strVal = String(value).trim();
      if (strVal === '') continue;

      if (!isValidAustralianPhone(strVal)) {
        issues.push({
          id: `au-phone-${rowIdx}-${colName}`,
          row: rowIdx,
          column: colName,
          severity: 'warning',
          category: 'australian_format',
          message: `Phone "${strVal}" is not a valid Australian phone number`,
          currentValue: strVal,
        });
      } else {
        // Suggest formatted version if different
        const formatted = formatAustralianPhone(strVal);
        if (formatted !== strVal) {
          issues.push({
            id: `au-phone-fmt-${rowIdx}-${colName}`,
            row: rowIdx,
            column: colName,
            severity: 'warning',
            category: 'australian_format',
            message: `Phone "${strVal}" can be formatted as "${formatted}"`,
            currentValue: strVal,
            suggestedValue: formatted,
          });
        }
      }
    }
  }

  return issues;
}
