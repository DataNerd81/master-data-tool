'use client';

import type { CategoryScore } from '@/types';
import { cn } from '@/components/ui/cn';

interface ScoreBreakdownProps {
  categoryScores: CategoryScore[];
}

function getBarColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getBarTrack(score: number): string {
  if (score >= 85) return 'bg-emerald-100';
  if (score >= 70) return 'bg-yellow-100';
  if (score >= 40) return 'bg-orange-100';
  return 'bg-red-100';
}

function getScoreTextColor(score: number): string {
  if (score >= 85) return 'text-emerald-700';
  if (score >= 70) return 'text-yellow-700';
  if (score >= 40) return 'text-orange-700';
  return 'text-red-700';
}

export function ScoreBreakdown({ categoryScores }: ScoreBreakdownProps) {
  if (categoryScores.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categoryScores.map((cat) => {
        const isNA = cat.score < 0;
        const displayScore = isNA ? 0 : cat.score;

        return (
          <div
            key={cat.category}
            className={cn(
              'rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
              isNA && 'opacity-60',
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-gray-700">{cat.label}</p>
              {isNA ? (
                <span className="text-sm font-semibold text-gray-400">N/A</span>
              ) : (
                <span
                  className={cn(
                    'text-lg font-bold tabular-nums',
                    getScoreTextColor(displayScore),
                  )}
                >
                  {Math.round(displayScore)}%
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div
              className={cn(
                'mt-3 h-2 w-full rounded-full',
                isNA ? 'bg-gray-100' : getBarTrack(displayScore),
              )}
            >
              {!isNA && (
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    getBarColor(displayScore),
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(0, displayScore))}%`,
                  }}
                />
              )}
            </div>

            {/* Issue count */}
            <p className="mt-2 text-xs text-gray-500">
              {isNA ? (
                <span className="text-gray-400">
                  Not applicable to this template
                </span>
              ) : cat.issueCount === 0 ? (
                <span className="text-emerald-600">No issues</span>
              ) : (
                <>
                  <span className="font-semibold text-gray-700">
                    {cat.issueCount}
                  </span>{' '}
                  {cat.issueCount === 1 ? 'issue' : 'issues'} found
                </>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
