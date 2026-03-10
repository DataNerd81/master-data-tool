'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import type { DataRow, CellValue, ValidationIssue } from '@/types';
import { cn } from '@/components/ui/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IssueTab = 'all' | 'missing' | 'duplicates' | 'negatives' | 'unsure';

interface DataReviewTableProps {
  /** The full data set (all 7 columns). */
  data: DataRow[];
  /** All validation issues from the engine. */
  issues: ValidationIssue[];
  /** The 7 schema column names in order. */
  columns: string[];
  /** Called when a cell value is edited. */
  onEditCell: (rowIndex: number, column: string, newValue: CellValue) => void;
  /** Called when a row is deleted. */
  onDeleteRow: (rowIndex: number) => void;
  /** Called when the user clicks "Verify Changes" — re-runs validation for the given tab. */
  onVerify: (tab: IssueTab) => void;
  /** Set of tab IDs that have been verified/confirmed. */
  verifiedTabs: Set<IssueTab>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

const TABS: { id: IssueTab; label: string; color: string; activeColor: string }[] = [
  { id: 'all',        label: 'All Data',       color: 'bg-gray-100 text-gray-700',  activeColor: 'bg-kn-blue text-white' },
  { id: 'missing',    label: 'Missing Data',   color: 'bg-red-50 text-red-700',     activeColor: 'bg-red-600 text-white' },
  { id: 'duplicates', label: 'Duplicate Data',  color: 'bg-amber-50 text-amber-700', activeColor: 'bg-amber-500 text-white' },
  { id: 'negatives',  label: 'Negative Qty',   color: 'bg-orange-50 text-orange-700', activeColor: 'bg-orange-500 text-white' },
  { id: 'unsure',     label: 'Unsure / N/A',   color: 'bg-purple-50 text-purple-700', activeColor: 'bg-purple-600 text-white' },
];

function formatCell(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    const d = String(value.getDate()).padStart(2, '0');
    const m = String(value.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${value.getFullYear()}`;
  }
  return String(value);
}

/**
 * Build a lookup: rowIndex → Set of issue categories affecting that row.
 */
function buildRowIssueMap(issues: ValidationIssue[]) {
  const map = new Map<number, Set<string>>();
  for (const issue of issues) {
    let set = map.get(issue.row);
    if (!set) {
      set = new Set();
      map.set(issue.row, set);
    }
    set.add(issue.category);
  }
  return map;
}

/**
 * Build a lookup: `${rowIndex}::${column}` → ValidationIssue[]
 */
function buildCellIssueMap(issues: ValidationIssue[]) {
  const map = new Map<string, ValidationIssue[]>();
  for (const issue of issues) {
    const key = `${issue.row}::${issue.column}`;
    const arr = map.get(key) || [];
    arr.push(issue);
    map.set(key, arr);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataReviewTable({
  data,
  issues,
  columns,
  onEditCell,
  onDeleteRow,
  onVerify,
  verifiedTabs,
}: DataReviewTableProps) {
  const [activeTab, setActiveTab] = useState<IssueTab>('all');
  const [page, setPage] = useState(0);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Issue lookups
  const rowIssueMap = useMemo(() => buildRowIssueMap(issues), [issues]);
  const cellIssueMap = useMemo(() => buildCellIssueMap(issues), [issues]);

  // Count issues per tab
  const tabCounts = useMemo(() => {
    const missing = new Set<number>();
    const duplicates = new Set<number>();
    const negatives = new Set<number>();
    const unsure = new Set<number>();

    for (const issue of issues) {
      if (issue.category === 'required_fields') missing.add(issue.row);
      if (issue.category === 'duplicate') duplicates.add(issue.row);
      if (issue.category === 'data_type' && issue.severity === 'warning' && issue.message.includes('below minimum')) negatives.add(issue.row);
      if (issue.category === 'auto_detected') unsure.add(issue.row);
    }

    return {
      all: data.length,
      missing: missing.size,
      duplicates: duplicates.size,
      negatives: negatives.size,
      unsure: unsure.size,
    };
  }, [issues, data.length]);

  // Filter rows by active tab
  const filteredIndices = useMemo(() => {
    if (activeTab === 'all') {
      return Array.from({ length: data.length }, (_, i) => i);
    }

    const matchingRows = new Set<number>();
    for (const issue of issues) {
      const matches =
        (activeTab === 'missing' && issue.category === 'required_fields') ||
        (activeTab === 'duplicates' && issue.category === 'duplicate') ||
        (activeTab === 'negatives' && issue.category === 'data_type' && issue.severity === 'warning' && issue.message.includes('below minimum')) ||
        (activeTab === 'unsure' && issue.category === 'auto_detected');

      if (matches) matchingRows.add(issue.row);
    }

    return Array.from(matchingRows).sort((a, b) => a - b);
  }, [activeTab, issues, data.length]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredIndices.length / PAGE_SIZE));
  const pageIndices = filteredIndices.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleTabChange(tab: IssueTab) {
    setActiveTab(tab);
    setPage(0);
    setEditingCell(null);
  }

  // Inline editing
  function startEdit(rowIndex: number, col: string) {
    setEditingCell({ row: rowIndex, col });
    setEditValue(formatCell(data[rowIndex]?.[col]));
  }

  function commitEdit() {
    if (!editingCell) return;
    onEditCell(editingCell.row, editingCell.col, editValue);
    setEditingCell(null);
  }

  function cancelEdit() {
    setEditingCell(null);
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') commitEdit();
      if (e.key === 'Escape') cancelEdit();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingCell, editValue],
  );

  // Cell styling based on issues
  function getCellClass(rowIndex: number, col: string): string {
    const key = `${rowIndex}::${col}`;
    const cellIssues = cellIssueMap.get(key);
    if (!cellIssues || cellIssues.length === 0) return '';

    for (const issue of cellIssues) {
      if (issue.category === 'required_fields') return 'bg-red-100 text-red-800';
      if (issue.category === 'duplicate') return 'bg-amber-100 text-amber-800';
      if (issue.category === 'data_type' && issue.message.includes('below minimum')) return 'bg-orange-100 text-orange-800';
      if (issue.category === 'auto_detected') return 'bg-purple-100 text-purple-800';
    }
    return 'bg-yellow-50';
  }

  function getRowClass(rowIndex: number): string {
    const cats = rowIssueMap.get(rowIndex);
    if (!cats) return '';
    if (cats.has('required_fields')) return 'border-l-4 border-l-red-400';
    if (cats.has('duplicate')) return 'border-l-4 border-l-amber-400';
    if (cats.has('data_type')) return 'border-l-4 border-l-orange-400';
    if (cats.has('auto_detected')) return 'border-l-4 border-l-purple-400';
    return '';
  }

  function getCellTooltip(rowIndex: number, col: string): string | undefined {
    const key = `${rowIndex}::${col}`;
    const cellIssues = cellIssueMap.get(key);
    if (!cellIssues || cellIssues.length === 0) return undefined;
    return cellIssues.map((i) => i.message).join('\n');
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const count = tabCounts[tab.id];
          const isActive = activeTab === tab.id;
          const isVerified = verifiedTabs.has(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                isActive ? tab.activeColor + ' shadow-sm' : tab.color + ' hover:opacity-80',
              )}
            >
              {isVerified && tab.id !== 'all' && (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {tab.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  isActive ? 'bg-white/25 text-white' : 'bg-black/5',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-300 bg-gray-100">
              <th className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 w-12">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-600"
                >
                  {col}
                </th>
              ))}
              <th className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pageIndices.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  {activeTab === 'all'
                    ? 'No data loaded'
                    : `No ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} found`}
                </td>
              </tr>
            ) : (
              pageIndices.map((rowIdx) => {
                const row = data[rowIdx];
                if (!row) return null;
                const rowClass = getRowClass(rowIdx);

                return (
                  <tr
                    key={rowIdx}
                    className={cn(
                      'border-b border-gray-100 transition-colors hover:bg-blue-50/30',
                      rowClass,
                    )}
                  >
                    {/* Row number */}
                    <td className="px-2 py-1.5 text-center text-xs font-medium tabular-nums text-gray-400">
                      {rowIdx + 1}
                    </td>

                    {/* Data cells */}
                    {columns.map((col) => {
                      const isEditing = editingCell?.row === rowIdx && editingCell?.col === col;
                      const cellClass = getCellClass(rowIdx, col);
                      const tooltip = getCellTooltip(rowIdx, col);
                      const val = row[col];

                      return (
                        <td
                          key={col}
                          className={cn(
                            'px-3 py-1.5 max-w-[200px]',
                            cellClass,
                          )}
                          title={tooltip}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full rounded border border-kn-teal bg-white px-1.5 py-0.5 text-sm outline-none ring-2 ring-kn-teal/30"
                              />
                              <button
                                type="button"
                                onClick={commitEdit}
                                className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded p-0.5 text-gray-400 hover:bg-gray-100"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span
                              className={cn(
                                'block truncate cursor-pointer',
                                !val && val !== 0 ? 'italic text-gray-300' : '',
                              )}
                              onDoubleClick={() => startEdit(rowIdx, col)}
                            >
                              {formatCell(val) || '(empty)'}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Actions */}
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="Edit row"
                          onClick={() => startEdit(rowIdx, columns[0])}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-kn-blue"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Delete row"
                          onClick={() => onDeleteRow(rowIdx)}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Verify & Confirm section — shown on issue tabs (not All Data) */}
      {activeTab !== 'all' && (
        <div className="mt-4">
          {verifiedTabs.has(activeTab) && tabCounts[activeTab] === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {TABS.find((t) => t.id === activeTab)?.label} — Verified
                </p>
                <p className="text-xs text-emerald-600">
                  All issues in this section have been resolved.
                </p>
              </div>
            </div>
          ) : verifiedTabs.has(activeTab) && tabCounts[activeTab] > 0 ? (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    {tabCounts[activeTab]} issue{tabCounts[activeTab] !== 1 ? 's' : ''} remaining
                  </p>
                  <p className="text-xs text-amber-600">
                    Make your changes above, then verify again.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onVerify(activeTab)}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" />
                Re-verify
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-5 py-3">
              <p className="text-sm text-gray-600">
                {tabCounts[activeTab] > 0
                  ? `Review the ${tabCounts[activeTab]} issue${tabCounts[activeTab] !== 1 ? 's' : ''} above, make changes, then verify.`
                  : 'No issues found in this section.'}
              </p>
              <button
                type="button"
                onClick={() => onVerify(activeTab)}
                className="inline-flex items-center gap-2 rounded-lg bg-kn-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-kn-teal/90 active:scale-[0.98]"
              >
                <CheckCircle2 className="h-4 w-4" />
                {tabCounts[activeTab] === 0 ? 'Confirm Section' : 'Verify Changes'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing rows {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, filteredIndices.length)} of{' '}
            {filteredIndices.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                page === 0
                  ? 'cursor-not-allowed text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 7 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'h-7 w-7 rounded-lg text-xs font-medium transition-colors',
                    page === pageNum
                      ? 'bg-kn-blue text-white'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              type="button"
              disabled={page === totalPages - 1}
              onClick={() => setPage(page + 1)}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                page === totalPages - 1
                  ? 'cursor-not-allowed text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
