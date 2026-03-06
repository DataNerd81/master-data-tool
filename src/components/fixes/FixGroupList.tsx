'use client';

import { useMemo } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import type { FixGroup } from '@/types';
import { FixGroupCard } from './FixGroupCard';
import { cn } from '@/components/ui/cn';

interface FixGroupListProps {
  fixGroups: FixGroup[];
  onToggle: (id: string) => void;
  onToggleAll: (enabled: boolean) => void;
}

export function FixGroupList({
  fixGroups,
  onToggle,
  onToggleAll,
}: FixGroupListProps) {
  const stats = useMemo(() => {
    const enabledGroups = fixGroups.filter((g) => g.enabled);
    const totalIssues = enabledGroups.reduce((t, g) => t + g.issueCount, 0);
    const totalRows = enabledGroups.reduce((t, g) => t + g.affectedRows, 0);
    return {
      selected: enabledGroups.length,
      total: fixGroups.length,
      totalIssues,
      totalRows,
    };
  }, [fixGroups]);

  const allEnabled = fixGroups.length > 0 && fixGroups.every((g) => g.enabled);

  if (fixGroups.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">
          No fix recommendations available. Your data may already be clean.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Summary */}
        <p className="text-sm text-gray-600">
          <strong className="font-semibold text-gray-900">
            {stats.selected}
          </strong>{' '}
          of {stats.total} fix groups selected, affecting{' '}
          <strong className="font-semibold text-gray-900">
            {stats.totalRows}
          </strong>{' '}
          rows ({stats.totalIssues} issues)
        </p>

        {/* Toggle All */}
        <button
          type="button"
          onClick={() => onToggleAll(!allEnabled)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors',
            allEnabled
              ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              : 'border-kn-teal bg-kn-teal/5 text-kn-teal hover:bg-kn-teal/10',
          )}
        >
          {allEnabled ? (
            <>
              <ToggleRight className="h-4 w-4" />
              Deselect All
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4" />
              Select All
            </>
          )}
        </button>
      </div>

      {/* Fix Group Cards */}
      <div className="space-y-3">
        {fixGroups.map((group) => (
          <FixGroupCard
            key={group.id}
            group={group}
            onToggle={() => onToggle(group.id)}
          />
        ))}
      </div>
    </div>
  );
}
