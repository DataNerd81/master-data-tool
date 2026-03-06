import Fuse from 'fuse.js';
import type { ColumnMapping, TemplateSchema } from '@/types';

// ---------------------------------------------------------------------------
// Auto-Mapper — fuzzy-matches source column headers to schema columns
// ---------------------------------------------------------------------------

interface SchemaTarget {
  /** The canonical target column name from the schema */
  name: string;
  /** All searchable names: the column name itself plus its aliases */
  searchTerms: string[];
}

/**
 * Automatically map source column headers to target schema columns using
 * Fuse.js for fuzzy matching. Each source column is matched against both
 * the schema column names and their aliases.
 *
 * Confidence levels:
 * - exact:    score === 0 (perfect match)
 * - high:     score < 0.2  (>0.8 similarity)
 * - medium:   score < 0.5  (>0.5 similarity)
 * - low:      score < 0.7  (>0.3 similarity)
 * - unmapped: no match found or score >= 0.7
 *
 * @param sourceHeaders  - Column headers from the uploaded file
 * @param schema         - The target template schema
 * @returns Array of ColumnMapping objects with confidence scores
 */
export function autoMapColumns(
  sourceHeaders: string[],
  schema: TemplateSchema,
): ColumnMapping[] {
  // Build the list of target columns with all searchable names
  const targets: SchemaTarget[] = schema.columns.map((col) => ({
    name: col.name,
    searchTerms: [
      col.name.toLowerCase(),
      ...col.aliases.map((a) => a.toLowerCase()),
    ],
  }));

  // Build a flat list of searchable items for Fuse.js
  // Each entry maps a search term back to its target column name
  const searchItems = targets.flatMap((t) =>
    t.searchTerms.map((term) => ({
      term,
      targetName: t.name,
    })),
  );

  const fuse = new Fuse(searchItems, {
    keys: ['term'],
    threshold: 0.7, // maximum fuzzy distance to consider
    includeScore: true,
    isCaseSensitive: false,
    shouldSort: true,
  });

  // Track which target columns have already been claimed (1:1 mapping)
  const claimedTargets = new Set<string>();

  // First pass: collect best matches for all source headers
  const candidates: {
    sourceCol: string;
    targetCol: string | null;
    score: number;
  }[] = [];

  for (const sourceCol of sourceHeaders) {
    const normalised = sourceCol.trim().toLowerCase();

    // Check for exact match first (before fuzzy matching)
    const exactMatch = searchItems.find((item) => item.term === normalised);
    if (exactMatch) {
      candidates.push({
        sourceCol,
        targetCol: exactMatch.targetName,
        score: 0,
      });
      continue;
    }

    // Fuzzy search
    const results = fuse.search(normalised);
    if (results.length > 0) {
      const best = results[0];
      candidates.push({
        sourceCol,
        targetCol: best.item.targetName,
        score: best.score ?? 1,
      });
    } else {
      candidates.push({ sourceCol, targetCol: null, score: 1 });
    }
  }

  // Sort by score (best matches first) so they get priority for claiming targets
  const sorted = [...candidates].sort((a, b) => a.score - b.score);

  // Assign targets, respecting 1:1 constraint
  const assignmentMap = new Map<string, { targetCol: string | null; score: number }>();

  for (const candidate of sorted) {
    if (
      candidate.targetCol &&
      !claimedTargets.has(candidate.targetCol)
    ) {
      claimedTargets.add(candidate.targetCol);
      assignmentMap.set(candidate.sourceCol, {
        targetCol: candidate.targetCol,
        score: candidate.score,
      });
    } else if (candidate.targetCol && claimedTargets.has(candidate.targetCol)) {
      // Target already claimed — mark as unmapped
      assignmentMap.set(candidate.sourceCol, { targetCol: null, score: 1 });
    } else {
      assignmentMap.set(candidate.sourceCol, { targetCol: null, score: 1 });
    }
  }

  // Build final mappings in original source header order
  return sourceHeaders.map((sourceCol) => {
    const assignment = assignmentMap.get(sourceCol) || {
      targetCol: null,
      score: 1,
    };
    const { targetCol, score } = assignment;

    return {
      sourceColumn: sourceCol,
      targetColumn: targetCol,
      confidence: getConfidence(score, targetCol),
      score: targetCol ? Math.round((1 - score) * 100) / 100 : 0,
    };
  });
}

/**
 * Map a Fuse.js score to a MappingConfidence level.
 */
function getConfidence(
  fuseScore: number,
  targetCol: string | null,
): ColumnMapping['confidence'] {
  if (!targetCol) return 'unmapped';
  if (fuseScore === 0) return 'exact';
  if (fuseScore < 0.2) return 'high';
  if (fuseScore < 0.5) return 'medium';
  if (fuseScore < 0.7) return 'low';
  return 'unmapped';
}
