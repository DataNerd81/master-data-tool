import type {
  DataRow,
  TemplateSchema,
  ColumnMapping,
  ValidationResult,
  ValidationIssue,
} from '@/types';
import { calculateReadinessScore } from './scoring';
import { checkRequiredFields } from './rules/required-fields';
import { checkNamingConventions } from './rules/naming-conventions';
import { checkDataTypes } from './rules/data-types';
import { checkDateFormats } from './rules/date-formats';
import { checkDuplicates } from './rules/duplicates';
import { checkHierarchy } from './rules/hierarchy';
import { checkUnits } from './rules/units';
import { checkAustralianFormats } from './rules/australian-formats';

// ---------------------------------------------------------------------------
// Validation Engine — orchestrates all validation rules
// ---------------------------------------------------------------------------

/**
 * All available validation rule functions.
 * Each takes data and schema, returns an array of issues.
 */
const RULES: ((data: DataRow[], schema: TemplateSchema) => ValidationIssue[])[] = [
  checkRequiredFields,
  checkNamingConventions,
  checkDataTypes,
  checkDateFormats,
  checkDuplicates,
  checkHierarchy,
  checkUnits,
  checkAustralianFormats,
];

/**
 * Run all validation rules against the data and produce a ValidationResult.
 *
 * The data should already have columns renamed according to the mappings
 * (i.e., use mapped data where source columns are renamed to target schema
 * column names).
 *
 * @param data     - The data rows (already mapped to schema column names)
 * @param schema   - The target template schema
 * @param mappings - Column mappings (used here to verify which columns are present)
 * @returns A complete ValidationResult with issues, scores, and row counts
 */
export function validateData(
  data: DataRow[],
  schema: TemplateSchema,
  mappings: ColumnMapping[],
): ValidationResult {
  // Collect all issues from all rules
  const allIssues: ValidationIssue[] = [];

  for (const rule of RULES) {
    try {
      const issues = rule(data, schema);
      allIssues.push(...issues);
    } catch (err) {
      console.error('[ValidationEngine] Rule failed:', err);
      // Continue with other rules even if one fails
    }
  }

  // Calculate scores
  const { overallScore, categoryScores } = calculateReadinessScore(
    allIssues,
    data.length,
    schema,
  );

  // Count clean rows (rows with zero issues)
  const rowsWithIssues = new Set(allIssues.map((i) => i.row));
  const cleanRows = data.length - rowsWithIssues.size;

  return {
    overallScore,
    categoryScores,
    issues: allIssues,
    totalRows: data.length,
    cleanRows,
  };
}
