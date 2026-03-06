'use client';

import { ArrowRight } from 'lucide-react';
import type { FixSample, CellValue } from '@/types';
import { cn } from '@/components/ui/cn';

interface FixSampleTableProps {
  samples: FixSample[];
}

function formatCellValue(value: CellValue): string {
  if (value === null || value === undefined) return '(empty)';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export function FixSampleTable({ samples }: FixSampleTableProps) {
  if (samples.length === 0) {
    return (
      <p className="py-2 text-xs text-gray-400">
        No sample previews available for this fix group.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-left font-semibold text-gray-500">
              Row #
            </th>
            <th className="px-3 py-2 text-left font-semibold text-gray-500">
              Column
            </th>
            <th className="px-3 py-2 text-left font-semibold text-gray-500">
              Before
            </th>
            <th className="px-1 py-2" />
            <th className="px-3 py-2 text-left font-semibold text-gray-500">
              After
            </th>
          </tr>
        </thead>
        <tbody>
          {samples.map((sample, idx) => (
            <tr
              key={`${sample.row}-${sample.column}`}
              className={cn(
                'border-t border-gray-100',
                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30',
              )}
            >
              <td className="px-3 py-1.5 font-medium tabular-nums text-gray-900">
                {sample.row + 1}
              </td>
              <td className="px-3 py-1.5 text-gray-700">{sample.column}</td>
              <td className="px-3 py-1.5">
                <span className="text-red-600">
                  {formatCellValue(sample.before)}
                </span>
              </td>
              <td className="px-1 py-1.5">
                <ArrowRight className="h-3 w-3 text-gray-300" />
              </td>
              <td className="px-3 py-1.5">
                <span className="font-medium text-emerald-600">
                  {formatCellValue(sample.after)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
