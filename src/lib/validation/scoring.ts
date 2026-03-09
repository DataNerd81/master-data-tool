import type {
  ValidationIssue,
  CategoryScore,
  TemplateSchema,
  IssueCategory,
} from '@/types';

// ---------------------------------------------------------------------------
// Scoring — calculates readiness score from validation issues
// ---------------------------------------------------------------------------

/**
 * Category weights used for the overall readiness score.
 * These determine how much each category contributes to the final score.
 */
const CATEGORY_WEIGHTS: Record<string, { weight: number; label: string }> = {
  required_fields: { weight: 40, label: 'Required Fields' },
  naming_convention: { weight: 25, label: 'Naming Conventions' },
  data_type: { weight: 10, label: 'Data Types' },
  date_format: { weight: 10, label: 'Date Formats' },
  duplicate: { weight: 10, label: 'Duplicates' },
  hierarchy: { weight: 5, label: 'Hierarchy' },
  unit: { weight: 0, label: 'Units' }, // Informational, not weighted in score
  australian_format: { weight: 0, label: 'Australian Formats' }, // Informational
  auto_detected: { weight: 0, label: 'Auto-Detected (Verify)' }, // Informational — needs user review
};

/**
 * Determine whether a validation category is applicable to the given schema.
 * Non-applicable categories are excluded from the weighted average so they
 * don't inflate the score with a free 100%.
 */
function isCategoryApplicable(
  category: IssueCategory,
  schema: TemplateSchema,
): boolean {
  switch (category) {
    case 'required_fields':
      return schema.columns.some((c) => c.required);

    case 'naming_convention':
      return schema.columns.some((c) => c.transform === 'titleCase');

    case 'data_type':
      return schema.columns.some(
        (c) =>
          c.type !== 'text' ||
          (c.allowedValues && c.allowedValues.length > 0),
      );

    case 'date_format':
      return schema.columns.some((c) => c.type === 'date');

    case 'duplicate':
      return !!schema.uniqueConstraint && schema.uniqueConstraint.length > 0;

    case 'hierarchy':
      return !!schema.hierarchy && !!schema.hierarchy.parentColumn;

    case 'unit':
    case 'australian_format':
    case 'auto_detected':
      return true; // Informational — always shown but never weighted

    default:
      return true;
  }
}

/**
 * Calculate the readiness score for a dataset based on validation issues.
 *
 * Key scoring rules:
 * 1. Only categories applicable to the schema are included in the weighted
 *    average. Non-applicable categories (e.g. "Date Formats" when there are
 *    no date columns) show as "N/A" (score = -1).
 * 2. The overall score is capped relative to the Required Fields score —
 *    if required fields are mostly missing, the data is fundamentally
 *    unusable and the score reflects that.
 */
export function calculateReadinessScore(
  issues: ValidationIssue[],
  totalRows: number,
  schema: TemplateSchema,
): { overallScore: number; categoryScores: CategoryScore[] } {
  if (totalRows === 0) {
    return {
      overallScore: 0,
      categoryScores: [],
    };
  }

  // Group issues by category
  const issuesByCategory = new Map<IssueCategory, ValidationIssue[]>();
  for (const issue of issues) {
    const existing = issuesByCategory.get(issue.category) || [];
    existing.push(issue);
    issuesByCategory.set(issue.category, existing);
  }

  // Calculate per-category scores
  const categoryScores: CategoryScore[] = [];
  let weightedSum = 0;
  let totalWeight = 0;
  let requiredFieldsScore = 100;

  for (const [category, config] of Object.entries(CATEGORY_WEIGHTS)) {
    const cat = category as IssueCategory;
    const catIssues = issuesByCategory.get(cat) || [];
    const applicable = isCategoryApplicable(cat, schema);

    // Count unique affected rows for this category
    const affectedRows = new Set(catIssues.map((i) => i.row)).size;

    // Score: percentage of clean rows, or -1 if not applicable
    let score: number;
    if (!applicable && catIssues.length === 0) {
      score = -1; // N/A — category doesn't apply to this schema
    } else {
      score = Math.max(
        0,
        Math.round(((totalRows - affectedRows) / totalRows) * 100),
      );
    }

    categoryScores.push({
      category,
      label: config.label,
      weight: config.weight,
      score,
      issueCount: catIssues.length,
    });

    // Track required fields score for the cap
    if (cat === 'required_fields') {
      requiredFieldsScore = score === -1 ? 100 : score;
    }

    // Only include applicable, weighted categories in overall score
    if (config.weight > 0 && score >= 0) {
      weightedSum += score * config.weight;
      totalWeight += config.weight;
    }
  }

  // Calculate overall weighted score (only from applicable categories)
  let overallScore =
    totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // Cap: overall score can't exceed requiredFieldsScore + 15.
  // Rationale: if required fields are 0%, the data is fundamentally unusable
  // and the score should reflect that, not be inflated by other checks passing.
  const cap = Math.min(100, requiredFieldsScore + 15);
  overallScore = Math.min(overallScore, cap);

  // Sort category scores: weighted first (by weight desc), then unweighted
  categoryScores.sort((a, b) => {
    if (a.weight === 0 && b.weight > 0) return 1;
    if (a.weight > 0 && b.weight === 0) return -1;
    return b.weight - a.weight;
  });

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    categoryScores,
  };
}
