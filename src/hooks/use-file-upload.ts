'use client';

import { useState, useCallback } from 'react';
import { parseWorkbook } from '@/lib/excel/parser';
import { preProcessFuelData, type PreProcessResult } from '@/lib/transforms/pre-processor';
import { useDataStore } from '@/stores/data-store';

// ---------------------------------------------------------------------------
// useFileUpload — handles file parsing, pre-processing, and data store updates
// ---------------------------------------------------------------------------

interface UseFileUploadReturn {
  /** Parse an Excel file and load it into the data store. */
  uploadFile: (file: File) => Promise<void>;
  /** Whether a file is currently being parsed. */
  isLoading: boolean;
  /** Error message from the most recent upload attempt, or null. */
  error: string | null;
  /** Pre-processing summary from the most recent upload, or null. */
  preProcessSummary: PreProcessResult['summary'] | null;
}

/**
 * Custom hook for uploading and parsing Excel files.
 *
 * Calls the parser to read the file, runs the pre-processor to clean
 * messy fuel card data (extract regos, filter junk, default units),
 * then updates the data store.
 */
export function useFileUpload(): UseFileUploadReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preProcessSummary, setPreProcessSummary] = useState<PreProcessResult['summary'] | null>(null);

  const { setWorkbook, setSelectedSheets, setActiveData } = useDataStore();

  const uploadFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setPreProcessSummary(null);

      try {
        // Validate file type
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        if (!validExtensions.includes(ext)) {
          throw new Error(
            `Unsupported file type "${ext}". Please upload an Excel file (.xlsx, .xls) or CSV (.csv).`,
          );
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(
            `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`,
          );
        }

        // Parse the workbook
        const workbook = await parseWorkbook(file);

        if (workbook.sheets.length === 0) {
          throw new Error('The uploaded file contains no data sheets.');
        }

        // Pre-process each sheet to clean messy fuel card data
        for (let i = 0; i < workbook.sheets.length; i++) {
          const sheet = workbook.sheets[i];
          if (sheet.data.length === 0) continue;

          const result = preProcessFuelData(sheet);

          // Update the sheet with cleaned data and updated headers
          workbook.sheets[i] = {
            ...sheet,
            headers: result.headers,
            data: result.data,
            rowCount: result.data.length,
          };

          // Store summary for the first sheet (primary display)
          if (i === 0) {
            setPreProcessSummary(result.summary);
          }
        }

        // Update the store
        setWorkbook(workbook);

        // Auto-select the first sheet with data
        const firstSheet = workbook.sheets.find((s) => s.data.length > 0);
        if (firstSheet) {
          setSelectedSheets([firstSheet.name]);
          setActiveData(firstSheet.data);
        } else {
          setSelectedSheets([workbook.sheets[0].name]);
          setActiveData([]);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to parse the file.';
        setError(message);
        console.error('[useFileUpload] Error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [setWorkbook, setSelectedSheets, setActiveData],
  );

  return { uploadFile, isLoading, error, preProcessSummary };
}
