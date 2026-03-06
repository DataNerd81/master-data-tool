'use client';

import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import type { ValidationIssue, CellValue } from '@/types';
import { cn } from '@/components/ui/cn';

interface BeforeAfterProps {
  issues: ValidationIssue[];
}

function formatCellValue(value: CellValue): string {
  if (value === null || value === undefined) return '(empty)';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export function BeforeAfter({ issues }: BeforeAfterProps) {
  const previewIssues = useMemo(
    () =>
      issues
        .filter((i) => i.suggestedValue !== undefined && i.suggestedValue !== null)
        .slice(0, 10),
    [issues],
  );

  if (previewIssues.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-gray-900">
        Preview: Top {previewIssues.length} Changes
      </h3>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Row #
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Column
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Before
              </th>
              <th className="px-1 py-3" />
              <th className="px-3 py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                After
              </th>
            </tr>
          </thead>
          <tbody>
            {previewIssues.map((issue, idx) => (
              <tr
                key={issue.id}
                className={cn(
                  'border-b border-gray-100',
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30',
                )}
              >
                <td className="px-4 py-2.5 text-sm font-medium tabular-nums text-gray-900">
                  {issue.row + 1}
                </td>
                <td className="px-3 py-2.5 text-sm text-gray-700">
                  {issue.column}
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-block rounded bg-red-50 px-2 py-0.5 text-sm text-red-700">
                    {formatCellValue(issue.currentValue)}
                  </span>
                </td>
                <td className="px-1 py-2.5">
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                </td>
                <td className="px-3 py-2.5 pr-4">
                  <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 text-sm font-medium text-emerald-700">
                    {formatCellValue(issue.suggestedValue)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
