'use client';

import {
  AlertCircle,
  Type,
  Hash,
  Calendar,
  Copy,
  GitBranch,
  Ruler,
  MapPin,
} from 'lucide-react';
import type { FixGroup, IssueCategory } from '@/types';
import { cn } from '@/components/ui/cn';

interface ExecuteSummaryProps {
  enabledGroups: FixGroup[];
}

const CATEGORY_ICONS: Record<IssueCategory, typeof AlertCircle> = {
  required_fields: AlertCircle,
  naming_convention: Type,
  data_type: Hash,
  date_format: Calendar,
  duplicate: Copy,
  hierarchy: GitBranch,
  unit: Ruler,
  australian_format: MapPin,
};

export function ExecuteSummary({ enabledGroups }: ExecuteSummaryProps) {
  const totalIssues = enabledGroups.reduce((t, g) => t + g.issueCount, 0);
  const totalRows = enabledGroups.reduce((t, g) => t + g.affectedRows, 0);

  if (enabledGroups.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">
          No fix groups are enabled. Go back to select fixes to apply.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning box */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              You are about to execute {totalIssues.toLocaleString()} changes
              across {totalRows.toLocaleString()} rows.
            </p>
            <p className="mt-1 text-xs text-amber-700">
              This will modify your data in memory. The original uploaded file
              will NOT be changed. You can download the cleaned file after
              execution.
            </p>
          </div>
        </div>
      </div>

      {/* Enabled fix groups list */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Changes to Apply
          </h3>
        </div>
        <ul className="divide-y divide-gray-100">
          {enabledGroups.map((group) => {
            const Icon = CATEGORY_ICONS[group.category] || AlertCircle;
            return (
              <li
                key={group.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-kn-blue/10">
                  <Icon className="h-4 w-4 text-kn-blue" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {group.label}
                  </p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-gray-600">
                  {group.issueCount}{' '}
                  {group.issueCount === 1 ? 'change' : 'changes'}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-gray-200 px-5 py-3">
          <p className="text-sm font-semibold text-gray-900">
            Total:{' '}
            <span className="text-kn-blue">
              {totalIssues.toLocaleString()} changes
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
