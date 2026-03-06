'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useFixesStore } from '@/stores/fixes-store';
import { useValidationStore } from '@/stores/validation-store';
import type { FixGroup, FixSample, ValidationIssue, IssueCategory } from '@/types';

// ---------------------------------------------------------------------------
// useFixes — generates fix groups from validation issues
// ---------------------------------------------------------------------------

/**
 * Category labels and descriptions for fix groups.
 */
const CATEGORY_META: Record<
  IssueCategory,
  { label: string; description: string }
> = {
  required_fields: {
    label: 'Missing Required Fields',
    description: 'Fill in empty required fields with default values where available',
  },
  naming_convention: {
    label: 'Naming Convention Fixes',
    description: 'Apply Title Case, trim whitespace, and remove invalid characters',
  },
  data_type: {
    label: 'Data Type Corrections',
    description: 'Convert values to the correct data type (numbers, booleans, enums)',
  },
  date_format: {
    label: 'Date Format Standardisation',
    description: 'Convert dates to dd/mm/yyyy format',
  },
  duplicate: {
    label: 'Duplicate Removal',
    description: 'Remove duplicate rows based on unique constraint columns',
  },
  hierarchy: {
    label: 'Hierarchy Fixes',
    description: 'Resolve orphaned records and circular references',
  },
  unit: {
    label: 'Unit Standardisation',
    description: 'Standardise unit strings to Australian/SI conventions',
  },
  australian_format: {
    label: 'Australian Format Fixes',
    description: 'Fix ABN, postcode, and phone number formatting',
  },
};

interface UseFixesReturn {
  /** All available fix groups. */
  fixGroups: FixGroup[];
  /** Toggle a single fix group on/off. */
  toggleFix: (id: string) => void;
  /** Enable or disable all fix groups. */
  toggleAll: (enabled: boolean) => void;
  /** Only the enabled fix groups. */
  enabledFixes: FixGroup[];
}

/**
 * Custom hook for managing fix recommendations.
 *
 * Generates fix groups from the validation result, grouping issues by
 * category. Each group includes sample before/after values and can be
 * toggled on/off.
 */
export function useFixes(): UseFixesReturn {
  const { fixGroups, setFixGroups, toggleFixGroup, toggleAll } = useFixesStore();
  const result = useValidationStore((s) => s.result);

  // Generate fix groups from validation issues when result changes
  const generateFixGroups = useCallback(() => {
    if (!result || result.issues.length === 0) {
      setFixGroups([]);
      return;
    }

    // Group issues by category
    const issuesByCategory = new Map<IssueCategory, ValidationIssue[]>();
    for (const issue of result.issues) {
      // Only include issues that have suggested fixes
      if (issue.suggestedValue === undefined && issue.category !== 'duplicate') {
        continue;
      }
      const existing = issuesByCategory.get(issue.category) || [];
      existing.push(issue);
      issuesByCategory.set(issue.category, existing);
    }

    const groups: FixGroup[] = [];

    for (const [category, issues] of issuesByCategory) {
      const meta = CATEGORY_META[category];
      const affectedRows = new Set(issues.map((i) => i.row)).size;

      // Build samples (up to 3 per group)
      const samples: FixSample[] = issues
        .filter((i) => i.suggestedValue !== undefined)
        .slice(0, 3)
        .map((issue) => ({
          row: issue.row,
          column: issue.column,
          before: issue.currentValue,
          after: issue.suggestedValue!,
        }));

      groups.push({
        id: `fix-${category}`,
        category,
        label: meta.label,
        description: meta.description,
        issueCount: issues.length,
        affectedRows,
        enabled: true, // enabled by default
        samples,
      });
    }

    // Sort: critical categories first, then by issue count
    const criticalCategories: IssueCategory[] = [
      'required_fields',
      'duplicate',
      'data_type',
    ];
    groups.sort((a, b) => {
      const aIsCritical = criticalCategories.includes(a.category) ? 0 : 1;
      const bIsCritical = criticalCategories.includes(b.category) ? 0 : 1;
      if (aIsCritical !== bIsCritical) return aIsCritical - bIsCritical;
      return b.issueCount - a.issueCount;
    });

    setFixGroups(groups);
  }, [result, setFixGroups]);

  // Auto-generate when result changes
  useEffect(() => {
    generateFixGroups();
  }, [generateFixGroups]);

  const enabledFixes = useMemo(
    () => fixGroups.filter((g) => g.enabled),
    [fixGroups],
  );

  return {
    fixGroups,
    toggleFix: toggleFixGroup,
    toggleAll,
    enabledFixes,
  };
}
