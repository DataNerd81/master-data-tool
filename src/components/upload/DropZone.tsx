'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, Loader2, AlertCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useDataStore } from '@/stores/data-store';
import { cn } from '@/components/ui/cn';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DropZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { uploadFile, isLoading, error, preProcessSummary } = useFileUpload();
  const workbook = useDataStore((s) => s.workbook);
  const setWorkbook = useDataStore((s) => s.setWorkbook);
  const [file, setFile] = useState<File | null>(null);

  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      await uploadFile(f);
    },
    [uploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile],
  );

  const handleClear = useCallback(() => {
    setFile(null);
    setWorkbook(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [setWorkbook]);

  // File has been uploaded and parsed successfully
  if (workbook && file && !isLoading) {
    return (
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Upload File
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Upload your Excel spreadsheet or CSV file.
        </p>

        <div className="rounded-xl border-2 border-kn-teal/30 bg-kn-teal/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-kn-teal/10">
              <FileSpreadsheet className="h-6 w-6 text-kn-teal" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {workbook.fileName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{formatFileSize(file.size)}</span>
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <span>
                  {workbook.sheets.length}{' '}
                  {workbook.sheets.length === 1 ? 'sheet' : 'sheets'}
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <span>
                  {workbook.sheets.reduce((t, s) => t + s.rowCount, 0)} total
                  rows
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Pre-processing summary */}
        {preProcessSummary && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold text-blue-800 mb-1.5">
              Smart Pre-Processing Results
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-700">
              <span>{preProcessSummary.totalInputRows} input rows</span>
              <span className="h-1 w-1 rounded-full bg-blue-300 self-center" />
              <span className="font-medium">{preProcessSummary.outputRows} clean data rows</span>
              {preProcessSummary.skippedJunkRows > 0 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-blue-300 self-center" />
                  <span>{preProcessSummary.skippedJunkRows} junk rows removed</span>
                </>
              )}
              {preProcessSummary.skippedSectionHeaders > 0 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-blue-300 self-center" />
                  <span>{preProcessSummary.skippedSectionHeaders} section headers processed</span>
                </>
              )}
            </div>
            {preProcessSummary.regosFound.length > 0 && (
              <p className="mt-1.5 text-xs text-blue-700">
                <span className="font-semibold">Regos found:</span>{' '}
                {preProcessSummary.regosFound.join(', ')}
              </p>
            )}
            {preProcessSummary.unitDefaulted && (
              <p className="mt-1 text-xs text-blue-600">
                No unit column detected — defaulted to Litres (L)
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Upload File</h2>
      <p className="mb-4 text-sm text-gray-500">
        Upload your Excel spreadsheet or CSV file.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-150',
          isDragOver
            ? 'border-kn-teal bg-kn-teal/5'
            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50',
          isLoading && 'pointer-events-none opacity-60',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload Excel or CSV file"
        />

        {isLoading ? (
          <>
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-kn-teal" />
            <p className="text-sm font-medium text-gray-700">
              Parsing your file...
            </p>
            <p className="mt-1 text-xs text-gray-500">
              This may take a moment for large files
            </p>
          </>
        ) : (
          <>
            <div
              className={cn(
                'mb-3 flex h-14 w-14 items-center justify-center rounded-full transition-colors',
                isDragOver ? 'bg-kn-teal/10' : 'bg-gray-100',
              )}
            >
              <Upload
                className={cn(
                  'h-6 w-6 transition-colors',
                  isDragOver ? 'text-kn-teal' : 'text-gray-400',
                )}
              />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Drag &amp; drop your Excel file
            </p>
            <p className="mt-1 text-xs text-gray-500">
              or{' '}
              <span className="font-medium text-kn-blue underline">
                click to browse
              </span>
            </p>
            <p className="mt-3 text-xs text-gray-400">
              Supports .xlsx, .xls, .csv (max 50MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
