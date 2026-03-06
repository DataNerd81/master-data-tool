'use client';

import { useState, useCallback } from 'react';
import { exportToExcel } from '@/lib/excel/exporter';
import { applyNamingFixes } from '@/lib/transforms/naming';
import { applyDateFixes } from '@/lib/transforms/dates';
import { applyDeduplication } from '@/lib/transforms/deduplication';
import { applyUnitFixes } from '@/lib/transforms/units';
import { useMappingStore } from '@/stores/mapping-store';
import { useDataStore } from '@/stores/data-store';
import { useValidationStore } from '@/stores/validation-store';
import { useFixesStore } from '@/stores/fixes-store';
import { useAppStore } from '@/stores/app-store';
import { getSchema } from '@/lib/schemas/registry';
import type { DataRow, IssueCategory } from '@/types';

// ---------------------------------------------------------------------------
// useExport — applies selected fixes and exports to Excel
// ---------------------------------------------------------------------------

interface UseExportReturn {
  /** Apply enabled fixes to the data (does NOT download). */
  applyFixes: () => void;
  /** Download the cleaned data as an Excel file. */
  downloadFile: () => void;
  /** Whether fixes are being applied. */
  isApplying: boolean;
  /** Whether the download is in progress. */
  isExporting: boolean;
  /** Legacy: apply + download in one call. */
  exportData: () => void;
}

export function useExport(): UseExportReturn {
  const [isApplying, setIsApplying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { getMappedData } = useMappingStore();
  const result = useValidationStore((s) => s.result);
  const { fixGroups, setExecuting, setProgress } = useFixesStore();
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);

  /**
   * Apply all enabled fixes to the data and update the store.
   * Does NOT trigger a file download.
   */
  const applyFixes = useCallback(() => {
    if (!selectedTemplateId) return;

    const schema = getSchema(selectedTemplateId);
    if (!schema) return;

    setIsApplying(true);
    setExecuting(true);
    setProgress(0);

    try {
      let data: DataRow[] = getMappedData();
      const issues = result?.issues || [];
      const enabledCategories = new Set<IssueCategory>(
        fixGroups.filter((g) => g.enabled).map((g) => g.category),
      );

      // Apply fixes in a logical order
      setProgress(10);
      if (enabledCategories.has('duplicate')) {
        data = applyDeduplication(data, schema);
      }

      setProgress(30);
      if (enabledCategories.has('naming_convention')) {
        data = applyNamingFixes(data, issues);
      }

      setProgress(50);
      if (enabledCategories.has('date_format')) {
        data = applyDateFixes(data, issues);
      }

      setProgress(70);
      if (enabledCategories.has('unit')) {
        data = applyUnitFixes(data, issues);
      }

      setProgress(80);
      if (enabledCategories.has('data_type')) {
        const dtIssues = issues.filter(
          (i) =>
            i.category === 'data_type' &&
            i.suggestedValue !== undefined &&
            i.suggestedValue !== null,
        );
        for (const issue of dtIssues) {
          if (data[issue.row]) {
            data[issue.row] = {
              ...data[issue.row],
              [issue.column]: issue.suggestedValue!,
            };
          }
        }
      }

      if (enabledCategories.has('australian_format')) {
        const auIssues = issues.filter(
          (i) =>
            i.category === 'australian_format' &&
            i.suggestedValue !== undefined &&
            i.suggestedValue !== null,
        );
        for (const issue of auIssues) {
          if (data[issue.row]) {
            data[issue.row] = {
              ...data[issue.row],
              [issue.column]: issue.suggestedValue!,
            };
          }
        }
      }

      setProgress(90);

      // Update the active data in the store so re-validation reflects fixes
      useDataStore.getState().setActiveData(data);

      setProgress(100);
    } catch (err) {
      console.error('[useExport] Apply fixes failed:', err);
    } finally {
      setIsApplying(false);
      setExecuting(false);
    }
  }, [
    selectedTemplateId,
    getMappedData,
    result,
    fixGroups,
    setExecuting,
    setProgress,
  ]);

  /**
   * Download the current active data as an Excel file.
   */
  const downloadFile = useCallback(() => {
    if (!selectedTemplateId) return;

    const schema = getSchema(selectedTemplateId);
    if (!schema) return;

    setIsExporting(true);

    try {
      const data = useDataStore.getState().activeData;
      if (!data || data.length === 0) return;

      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}.xlsx`;
      exportToExcel(data, schema, fileName);
    } catch (err) {
      console.error('[useExport] Download failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [selectedTemplateId]);

  /**
   * Legacy: apply fixes AND download in one call.
   */
  const exportData = useCallback(() => {
    applyFixes();
    setTimeout(() => downloadFile(), 100);
  }, [applyFixes, downloadFile]);

  return { applyFixes, downloadFile, isApplying, isExporting, exportData };
}
