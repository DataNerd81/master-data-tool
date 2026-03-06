'use client';

import { cn } from '@/components/ui/cn';

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      {/* Label */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          {clamped < 100 ? 'Applying fixes...' : 'Complete'}
        </p>
        <span className="text-sm font-bold tabular-nums text-kn-teal">
          {Math.round(clamped)}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            'bg-gradient-to-r from-kn-teal to-kn-blue',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {/* Status text */}
      {clamped < 100 && (
        <p className="mt-1.5 text-xs text-gray-500">
          Please wait while changes are being applied...
        </p>
      )}
    </div>
  );
}
