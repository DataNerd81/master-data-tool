'use client';

import { useState, useCallback } from 'react';
import { parseWorkbook } from '@/lib/excel/parser';
import { useDataStore } from '@/stores/data-store';

// ---------------------------------------------------------------------------
// useFileUpload — handles file parsing and data store updates
// ---------------------------------------------------------------------------

interface UseFileUploadReturn {
  /** Parse an Excel file and load it into the data store. */
  uploadFile: (file: File) => Promise<void>;
  /** Whether a file is currently being parsed. */
  isLoading: boolean;
  /** Error message from the most recent upload attempt, or null. */
  error: string | null;
}

/**
 * Custom hook for uploading and parsing Excel files.
 *
 * Calls the parser to read the file, then updates the data store with
 * the parsed workbook. Automatically selects the first sheet and sets
 * it as active data.
 */
export function useFileUpload(): UseFileUploadReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setWorkbook, setSelectedSheets, setActiveData } = useDataStore();

  const uploadFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

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

  return { uploadFile, isLoading, error };
}
