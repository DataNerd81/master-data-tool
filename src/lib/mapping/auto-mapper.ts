import Fuse from 'fuse.js';
import type { ColumnMapping, TemplateSchema, DataRow } from '@/types';

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

// ---------------------------------------------------------------------------
// Fuel Type Auto-Detection — infer NGA Category and Fuel Type from data
// ---------------------------------------------------------------------------

interface NGAEntry {
  category: string;
  fuelType: string;
}

/**
 * Keywords that suggest a specific fuel type. Ordered by specificity (most
 * specific first so that e.g. "renewable diesel" matches before "diesel").
 */
const FUEL_KEYWORDS: { pattern: RegExp; entry: NGAEntry }[] = [
  // Renewable diesel variants
  { pattern: /renewable\s*diesel.*euro\s*iv/i, entry: { category: 'Heavy duty vehicles', fuelType: 'Renewable diesel \u2013 Euro iv or higher' } },
  { pattern: /renewable\s*diesel.*euro\s*iii/i, entry: { category: 'Heavy duty vehicles', fuelType: 'Renewable diesel \u2013 Euro iii' } },
  { pattern: /renewable\s*diesel.*euro\s*i\b/i, entry: { category: 'Heavy duty vehicles', fuelType: 'Renewable diesel \u2013 Euro i' } },
  { pattern: /renewable\s*diesel/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Renewable diesel' } },

  // Diesel variants
  { pattern: /diesel.*euro\s*iv/i, entry: { category: 'Heavy duty vehicles', fuelType: 'Diesel oil - Euro iv or higher' } },
  { pattern: /diesel.*euro\s*iii/i, entry: { category: 'Heavy duty vehicles', fuelType: 'Diesel oil - Euro iii' } },
  { pattern: /diesel.*euro\s*i\b/i, entry: { category: 'Heavy duty vehicles', fuelType: 'Diesel oil - Euro i' } },
  { pattern: /diesel/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Diesel oil' } },

  // Petrol / Gasoline — must come AFTER diesel so "Premium Diesel" doesn't match "Premium"
  { pattern: /\b(petrol|gasoline)\b/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Gasoline (petrol)' } },
  { pattern: /\bunleaded\b/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Gasoline (petrol)' } },
  { pattern: /\b(ulp|pulp)\b/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Gasoline (petrol)' } },
  { pattern: /\b(e10|e85)\b/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Gasoline (petrol)' } },
  { pattern: /\b(vortex|v-power|bp\s*ultimate)\b/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Gasoline (petrol)' } },
  { pattern: /\b(ron\s*9[1-8]|95\s*octane|98\s*octane)\b/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Gasoline (petrol)' } },

  // LPG
  { pattern: /\b(lpg|liquefied\s*petroleum|autogas)\b/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Liquefied petroleum gas (LPG)' } },

  // Biodiesel
  { pattern: /\bbiodiesel\b/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Biodiesel' } },

  // Ethanol
  { pattern: /\bethanol\b/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Ethanol' } },

  // Fuel oil
  { pattern: /\bfuel\s*oil\b/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Fuel oil' } },

  // Other biofuels
  { pattern: /\bbiofuel/i, entry: { category: 'Cars and light commercial vehicles', fuelType: 'Other biofuels' } },

  // CNG
  { pattern: /\b(cng|compressed\s*natural\s*gas)\b/i, entry: { category: 'Light duty vehicles', fuelType: 'Compressed natural gas (Light Duty Vehicle)' } },

  // LNG
  { pattern: /\b(lng|liquefied\s*natural\s*gas)\b/i, entry: { category: 'Light duty vehicles', fuelType: 'Liquefied natural gas' } },

  // Aviation fuel
  { pattern: /\b(avgas|aviation\s*gas)/i, entry: { category: 'Aviation', fuelType: 'Gasoline for use as fuel in an aircraft' } },
  { pattern: /\b(jet\s*fuel|jet\s*a|avtur|aviation\s*kerosene)/i, entry: { category: 'Aviation', fuelType: 'Kerosene for use as fuel in an aircraft' } },
  { pattern: /\brenewable\s*aviation/i, entry: { category: 'Aviation', fuelType: 'Renewable aviation kerosene' } },
];

/**
 * Attempt to infer the NGA Category and Fuel Type from text that might
 * appear in a messy spreadsheet (e.g. product descriptions, column values).
 *
 * Returns null if no match is found.
 */
export function inferFuelType(text: string): NGAEntry | null {
  if (!text || typeof text !== 'string') return null;
  const normalised = text.trim();
  if (!normalised) return null;

  for (const { pattern, entry } of FUEL_KEYWORDS) {
    if (pattern.test(normalised)) {
      return entry;
    }
  }

  return null;
}

/**
 * Auto-populate NGA Category and Fuel Type for each data row by scanning
 * all columns for fuel-related keywords.
 *
 * This function looks through every cell value in a row for clues about
 * what fuel was used, then populates the Category and Fuel Type columns.
 *
 * @param data       - The mapped data rows (target column names)
 * @returns Updated data rows with Category and Fuel Type populated where possible
 */
export function autoPopulateFuelType(data: DataRow[]): DataRow[] {
  const categoryCol = 'Category (from NGA table on right)';
  const fuelTypeCol = 'Fuel Type (from NGA table on right)';

  return data.map((row) => {
    const newRow = { ...row };

    const existingCat = row[categoryCol];
    const existingFt = row[fuelTypeCol];

    // If both are already populated with valid values, skip
    if (existingCat && existingFt) return newRow;

    // Scan all columns in this row for fuel type clues
    let bestMatch: NGAEntry | null = null;

    for (const [, val] of Object.entries(row)) {
      if (val === null || val === undefined) continue;
      const textVal = String(val);
      const match = inferFuelType(textVal);
      if (match) {
        bestMatch = match;
        break;
      }
    }

    if (bestMatch) {
      if (!existingCat) {
        newRow[categoryCol] = bestMatch.category;
      }
      if (!existingFt) {
        newRow[fuelTypeCol] = bestMatch.fuelType;
      }
    }

    return newRow;
  });
}
