'use client';

import { useState, useMemo, useCallback } from 'react';
import { Table, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useDataStore } from '@/stores/data-store';
import { getSheetPreview } from '@/lib/excel/parser';
import { cn } from '@/components/ui/cn';
import type { ParsedSheet, CellValue } from '@/types';

function formatCellValue(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

interface SheetCardProps {
  sheet: ParsedSheet;
  isSelected: boolean;
  onToggle: () => void;
}

function SheetCard({ sheet, isSelected, onToggle }: SheetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const preview = useMemo(() => getSheetPreview(sheet, 5), [sheet]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border-2 transition-all duration-150',
        isSelected
          ? 'border-kn-teal/40 bg-white shadow-sm'
          : 'border-gray-200 bg-white',
      )}
    >
      {/* Sheet header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors',
            isSelected
              ? 'border-kn-teal bg-kn-teal'
              : 'border-gray-300 bg-white hover:border-gray-400',
          )}
          aria-label={`Select sheet "${sheet.name}"`}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </button>

        {/* Sheet icon & info */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Table className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <span className="truncate text-sm font-medium text-gray-900">
            {sheet.name}
          </span>
        </div>

        {/* Row count badge */}
        <span className="flex-shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {sheet.rowCount.toLocaleString()} rows
        </span>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label={isExpanded ? 'Collapse preview' : 'Expand preview'}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Preview table */}
      {isExpanded && preview.length > 0 && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-2">
          <p className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Preview (first 5 rows)
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  {sheet.headers.map((header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className={cn(
                      rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                    )}
                  >
                    {sheet.headers.map((header) => (
                      <td
                        key={header}
                        className="max-w-[200px] truncate whitespace-nowrap border-b border-gray-100 px-3 py-1.5 text-gray-600"
                      >
                        {formatCellValue(row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function SheetPicker() {
  const workbook = useDataStore((s) => s.workbook);
  const selectedSheets = useDataStore((s) => s.selectedSheets);
  const setSelectedSheets = useDataStore((s) => s.setSelectedSheets);
  const setActiveData = useDataStore((s) => s.setActiveData);

  const handleToggle = useCallback(
    (sheetName: string) => {
      const next = selectedSheets.includes(sheetName)
        ? selectedSheets.filter((n) => n !== sheetName)
        : [...selectedSheets, sheetName];

      setSelectedSheets(next);

      // Merge data from all selected sheets
      if (workbook) {
        const merged = workbook.sheets
          .filter((s) => next.includes(s.name))
          .flatMap((s) => s.data);
        setActiveData(merged);
      }
    },
    [workbook, selectedSheets, setSelectedSheets, setActiveData],
  );

  if (!workbook || workbook.sheets.length === 0) return null;

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Select Sheets
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        Choose which sheets to include. You can expand each sheet to preview the
        data.
      </p>

      <div className="space-y-3">
        {workbook.sheets.map((sheet) => (
          <SheetCard
            key={sheet.name}
            sheet={sheet}
            isSelected={selectedSheets.includes(sheet.name)}
            onToggle={() => handleToggle(sheet.name)}
          />
        ))}
      </div>
    </div>
  );
}
