'use client';

import { useState, useMemo, Fragment } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { ValidationIssue, IssueSeverity, CellValue } from '@/types';
import { cn } from '@/components/ui/cn';

interface IssuesTableProps {
  issues: ValidationIssue[];
}

type TabFilter = 'all' | IssueSeverity;

const TABS: { id: TabFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'warning', label: 'Warnings' },
  { id: 'suggestion', label: 'Suggestions' },
];

const SEVERITY_CONFIG: Record<
  IssueSeverity,
  { icon: typeof AlertCircle; className: string; badgeClass: string }
> = {
  critical: {
    icon: AlertCircle,
    className: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-700',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  suggestion: {
    icon: Info,
    className: 'text-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
};

const PAGE_SIZE = 25;

function formatCellValue(value: CellValue): string {
  if (value === null || value === undefined) return '(empty)';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

type SortField = 'row' | 'column' | 'severity';
type SortDir = 'asc' | 'desc';

export function IssuesTable({ issues }: IssuesTableProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [page, setPage] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('row');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Count issues per severity
  const counts = useMemo(() => {
    const c = { all: issues.length, critical: 0, warning: 0, suggestion: 0 };
    for (const issue of issues) {
      c[issue.severity]++;
    }
    return c;
  }, [issues]);

  // Filter
  const filtered = useMemo(() => {
    const base =
      activeTab === 'all'
        ? issues
        : issues.filter((i) => i.severity === activeTab);

    // Sort
    return [...base].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'row') {
        cmp = a.row - b.row;
      } else if (sortField === 'column') {
        cmp = a.column.localeCompare(b.column);
      } else if (sortField === 'severity') {
        const order: Record<IssueSeverity, number> = {
          critical: 0,
          warning: 1,
          suggestion: 2,
        };
        cmp = order[a.severity] - order[b.severity];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [issues, activeTab, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filter changes
  function handleTabChange(tab: TabFilter) {
    setActiveTab(tab);
    setPage(0);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortIndicator({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3" />
    );
  }

  return (
    <div>
      {/* Tab Bar */}
      <div className="mb-4 flex items-center gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => {
          const count = counts[tab.id];
          const isActive = activeTab === tab.id;
          const badgeClass =
            tab.id === 'critical'
              ? 'bg-red-100 text-red-700'
              : tab.id === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : tab.id === 'suggestion'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    isActive ? badgeClass : 'bg-gray-200 text-gray-500',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700"
                onClick={() => handleSort('row')}
              >
                Row # <SortIndicator field="row" />
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700"
                onClick={() => handleSort('column')}
              >
                Column <SortIndicator field="column" />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current Value
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Issue
              </th>
              <th className="px-3 py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Suggested Fix
              </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  No issues found
                </td>
              </tr>
            ) : (
              pageItems.map((issue) => {
                const config = SEVERITY_CONFIG[issue.severity];
                const Icon = config.icon;
                const isExpanded = expandedRow === issue.id;

                const isAutoDetected = issue.category === 'auto_detected';

                return (
                  <Fragment key={issue.id}>
                    <tr
                      onClick={() =>
                        setExpandedRow(isExpanded ? null : issue.id)
                      }
                      className={cn(
                        'cursor-pointer border-b transition-colors',
                        isAutoDetected
                          ? 'border-amber-200 bg-amber-50 hover:bg-amber-100/70'
                          : 'border-gray-100 hover:bg-gray-50/50',
                      )}
                    >
                      {/* Row # */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', config.className)} />
                          <span className="text-sm font-medium tabular-nums text-gray-900">
                            {issue.row + 1}
                          </span>
                          {isAutoDetected && (
                            <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                              VERIFY
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column */}
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'text-sm',
                          isAutoDetected ? 'font-medium text-amber-800' : 'text-gray-700',
                        )}>
                          {issue.column}
                        </span>
                      </td>

                      {/* Current Value */}
                      <td className="px-3 py-2.5">
                        {isAutoDetected ? (
                          <span className="text-sm font-medium text-amber-700">
                            {formatCellValue(issue.currentValue)}
                          </span>
                        ) : (
                          <span className="text-sm text-red-600 line-through">
                            {formatCellValue(issue.currentValue)}
                          </span>
                        )}
                      </td>

                      {/* Issue */}
                      <td className="max-w-[300px] px-3 py-2.5">
                        <span className={cn(
                          'line-clamp-1 text-sm',
                          isAutoDetected ? 'text-amber-700' : 'text-gray-600',
                        )}>
                          {issue.message}
                        </span>
                      </td>

                      {/* Suggested Fix */}
                      <td className="px-3 py-2.5 pr-4">
                        {issue.suggestedValue !== undefined ? (
                          <span className={cn(
                            'text-sm font-medium',
                            isAutoDetected ? 'text-amber-700' : 'text-emerald-600',
                          )}>
                            {formatCellValue(issue.suggestedValue)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">--</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${issue.id}-detail`} className="bg-gray-50/50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                            <div>
                              <p className="text-xs font-medium text-gray-400">
                                Category
                              </p>
                              <p className="mt-0.5 text-gray-700">
                                {issue.category.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-400">
                                Severity
                              </p>
                              <span
                                className={cn(
                                  'mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                                  config.badgeClass,
                                )}
                              >
                                {issue.severity}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs font-medium text-gray-400">
                                Full Message
                              </p>
                              <p className="mt-0.5 text-gray-700">
                                {issue.message}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length} issues
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
                    'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
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
