'use client';

import type { MappingConfidence } from '@/types';
import { cn } from '@/components/ui/cn';

interface ConfidenceBadgeProps {
  confidence: MappingConfidence;
  isOptional?: boolean;
}

const BADGE_CONFIG: Record<
  MappingConfidence,
  { label: string; className: string }
> = {
  exact: {
    label: 'Exact Match',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  high: {
    label: 'High',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  low: {
    label: 'Low',
    className: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  },
  unmapped: {
    label: 'Unmapped',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
};

export function ConfidenceBadge({ confidence, isOptional }: ConfidenceBadgeProps) {
  const config = BADGE_CONFIG[confidence];

  // If unmapped and optional, show a softer badge
  const effectiveClass =
    confidence === 'unmapped' && isOptional
      ? 'bg-gray-50 text-gray-500 ring-gray-500/20'
      : config.className;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        effectiveClass,
      )}
    >
      {config.label}
    </span>
  );
}
