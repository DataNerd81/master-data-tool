'use client';

import { useCallback } from 'react';
import { validateData } from '@/lib/validation/engine';
import { useValidationStore } from '@/stores/validation-store';
import { useMappingStore } from '@/stores/mapping-store';
import { useDataStore } from '@/stores/data-store';
import { useAppStore } from '@/stores/app-store';
import { getSchema } from '@/lib/schemas/registry';
import type { ValidationResult, ValidationIssue } from '@/types';

// ---------------------------------------------------------------------------
// useValidation — runs the validation engine and stores results
// ---------------------------------------------------------------------------

interface UseValidationReturn {
  /** Run validation on the current mapped data. */
  validate: () => void;
  /** The most recent validation result, or null. */
  result: ValidationResult | null;
  /** Whether validation is currently running. */
  isValidating: boolean;
}

/**
 * Custom hook for running data validation.
 *
 * Gets mapped data from the mapping store, runs the validation engine
 * against the selected template schema, and stores the result in the
 * validation store. Also injects auto-detected fuel type issues for
 * user review.
 */
export function useValidation(): UseValidationReturn {
  const { result, isValidating, setResult, setValidating } = useValidationStore();
  const autoDetectedCells = useValidationStore((s) => s.autoDetectedCells);
  const dismissedRows = useValidationStore((s) => s.dismissedRows);
  const { mappings, getMappedData } = useMappingStore();
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);

  const validate = useCallback(() => {
    if (!selectedTemplateId) return;

    const schema = getSchema(selectedTemplateId);
    if (!schema) return;

    setValidating(true);

    try {
      // Use active data (which includes auto-populated fuel types)
      const activeData = useDataStore.getState().activeData;

      // Fall back to mapped data if activeData is empty
      const data = activeData.length > 0 ? activeData : getMappedData();

      if (data.length === 0) {
        setResult({
          overallScore: 0,
          categoryScores: [],
          issues: [],
          totalRows: 0,
          cleanRows: 0,
        });
        return;
      }

      const validationResult = validateData(data, schema, mappings);

      // Inject auto-detected fuel type issues as "needs clarification" warnings
      if (autoDetectedCells.length > 0) {
        const autoIssues: ValidationIssue[] = autoDetectedCells.map((cell, idx) => ({
          id: `auto-detected-${idx}`,
          row: cell.row,
          column: cell.column,
          severity: 'warning' as const,
          category: 'auto_detected' as const,
          message: `Auto-detected as "${cell.value}" based on "${cell.matchedFrom}" — please verify`,
          currentValue: cell.value,
          suggestedValue: cell.value,
        }));

        validationResult.issues.push(...autoIssues);
      }

      // Remove issues for rows the user has confirmed as correct
      if (dismissedRows.size > 0) {
        validationResult.issues = validationResult.issues.filter(
          (issue) => !dismissedRows.has(issue.row),
        );
        // Recalculate clean rows after removing dismissed issues
        const rowsWithIssues = new Set(validationResult.issues.map((i) => i.row));
        validationResult.cleanRows = validationResult.totalRows - rowsWithIssues.size;
      }

      setResult(validationResult);
    } catch (err) {
      console.error('[useValidation] Validation failed:', err);
      setResult(null);
    } finally {
      setValidating(false);
    }
  }, [selectedTemplateId, mappings, getMappedData, setResult, setValidating, autoDetectedCells, dismissedRows]);

  return { validate, result, isValidating };
}
