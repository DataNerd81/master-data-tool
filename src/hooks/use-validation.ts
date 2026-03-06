'use client';

import { useCallback } from 'react';
import { validateData } from '@/lib/validation/engine';
import { useValidationStore } from '@/stores/validation-store';
import { useMappingStore } from '@/stores/mapping-store';
import { useAppStore } from '@/stores/app-store';
import { getSchema } from '@/lib/schemas/registry';
import type { ValidationResult } from '@/types';

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
 * validation store.
 */
export function useValidation(): UseValidationReturn {
  const { result, isValidating, setResult, setValidating } = useValidationStore();
  const { mappings, getMappedData } = useMappingStore();
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);

  const validate = useCallback(() => {
    if (!selectedTemplateId) return;

    const schema = getSchema(selectedTemplateId);
    if (!schema) return;

    setValidating(true);

    try {
      // Use mapped data (columns renamed per mappings)
      const mappedData = getMappedData();

      if (mappedData.length === 0) {
        setResult({
          overallScore: 0,
          categoryScores: [],
          issues: [],
          totalRows: 0,
          cleanRows: 0,
        });
        return;
      }

      const validationResult = validateData(mappedData, schema, mappings);
      setResult(validationResult);
    } catch (err) {
      console.error('[useValidation] Validation failed:', err);
      setResult(null);
    } finally {
      setValidating(false);
    }
  }, [selectedTemplateId, mappings, getMappedData, setResult, setValidating]);

  return { validate, result, isValidating };
}
