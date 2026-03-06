'use client';

import { useCallback, useMemo } from 'react';
import { autoMapColumns } from '@/lib/mapping/auto-mapper';
import {
  saveMappingConfig,
  loadMappingConfig,
} from '@/lib/mapping/mapping-storage';
import { useMappingStore } from '@/stores/mapping-store';
import { useDataStore } from '@/stores/data-store';
import { useAppStore } from '@/stores/app-store';
import { getSchema } from '@/lib/schemas/registry';
import type { ColumnMapping } from '@/types';

// ---------------------------------------------------------------------------
// useMapping — column mapping operations
// ---------------------------------------------------------------------------

interface UseMappingReturn {
  /** Run auto-mapping using Fuse.js fuzzy matching. */
  autoMap: () => void;
  /** Current column mappings. */
  mappings: ColumnMapping[];
  /** Update a single mapping (source -> target). */
  updateMapping: (sourceCol: string, targetCol: string | null) => void;
  /** Save current mappings to localStorage. */
  saveMappings: () => void;
  /** Load previously saved mappings from localStorage. Returns true if found. */
  loadMappings: () => boolean;
}

/**
 * Custom hook for column mapping operations.
 *
 * Provides auto-mapping on first call, allows manual overrides, and
 * supports saving/loading mapping configs to localStorage.
 */
export function useMapping(): UseMappingReturn {
  const { mappings, setMappings, updateMapping } = useMappingStore();
  const workbook = useDataStore((s) => s.workbook);
  const selectedSheets = useDataStore((s) => s.selectedSheets);
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);

  const autoMap = useCallback(() => {
    if (!selectedTemplateId || !workbook) return;

    const schema = getSchema(selectedTemplateId);
    if (!schema) return;

    // Gather headers from all selected sheets
    const headersSet = new Set<string>();
    for (const sheetName of selectedSheets) {
      const sheet = workbook.sheets.find((s) => s.name === sheetName);
      if (sheet) {
        for (const header of sheet.headers) {
          headersSet.add(header);
        }
      }
    }

    const sourceHeaders = Array.from(headersSet);
    if (sourceHeaders.length === 0) return;

    const result = autoMapColumns(sourceHeaders, schema);
    setMappings(result);
  }, [selectedTemplateId, workbook, selectedSheets, setMappings]);

  const saveMappings = useCallback(() => {
    if (!selectedTemplateId) return;
    saveMappingConfig({
      templateId: selectedTemplateId,
      mappings,
    });
  }, [selectedTemplateId, mappings]);

  const loadMappings = useCallback((): boolean => {
    if (!selectedTemplateId) return false;

    const config = loadMappingConfig(selectedTemplateId);
    if (config && config.mappings.length > 0) {
      setMappings(config.mappings);
      return true;
    }
    return false;
  }, [selectedTemplateId, setMappings]);

  return {
    autoMap,
    mappings,
    updateMapping,
    saveMappings,
    loadMappings,
  };
}
