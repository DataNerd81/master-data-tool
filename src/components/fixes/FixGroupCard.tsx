'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
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
import { FixSampleTable } from './FixSampleTable';
import { cn } from '@/components/ui/cn';

interface FixGroupCardProps {
  group: FixGroup;
  onToggle: () => void;
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

export function FixGroupCard({ group, onToggle }: FixGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[group.category] || AlertCircle;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border-2 transition-all duration-150',
        group.enabled
          ? 'border-gray-200 bg-white shadow-sm'
          : 'border-gray-100 bg-gray-50/50',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 p-4">
        {/* Toggle switch */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-kn-teal/30 focus:ring-offset-1',
            group.enabled ? 'bg-kn-teal' : 'bg-gray-300',
          )}
          role="switch"
          aria-checked={group.enabled}
          aria-label={`Toggle ${group.label}`}
        >
          <span
            className={cn(
              'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
              group.enabled ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>

        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
            group.enabled
              ? 'bg-kn-blue/10 text-kn-blue'
              : 'bg-gray-100 text-gray-400',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-sm font-semibold',
              group.enabled ? 'text-gray-900' : 'text-gray-400',
            )}
          >
            {group.label}
          </p>
          <p
            className={cn(
              'mt-0.5 text-xs',
              group.enabled ? 'text-gray-500' : 'text-gray-400',
            )}
          >
            {group.description}
          </p>
          <p
            className={cn(
              'mt-1.5 text-xs font-medium',
              group.enabled ? 'text-gray-600' : 'text-gray-400',
            )}
          >
            {group.issueCount} {group.issueCount === 1 ? 'issue' : 'issues'}{' '}
            across {group.affectedRows}{' '}
            {group.affectedRows === 1 ? 'row' : 'rows'}
          </p>
        </div>

        {/* Expand toggle */}
        {group.samples.length > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex-shrink-0 rounded-lg p-1.5 transition-colors',
              group.enabled
                ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                : 'text-gray-300',
            )}
            aria-label={isExpanded ? 'Hide samples' : 'Show samples'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Sample table */}
      {isExpanded && group.samples.length > 0 && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Sample Changes
          </p>
          <FixSampleTable samples={group.samples} />
        </div>
      )}
    </div>
  );
}
