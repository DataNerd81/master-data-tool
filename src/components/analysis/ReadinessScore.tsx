'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/components/ui/cn';

interface ReadinessScoreProps {
  score: number;
  totalRows: number;
  cleanRows: number;
}

function getScoreColor(score: number): {
  stroke: string;
  text: string;
  glow: string;
  bg: string;
} {
  if (score >= 85)
    return {
      stroke: 'stroke-emerald-500',
      text: 'text-emerald-600',
      glow: 'shadow-emerald-500/30',
      bg: 'bg-emerald-50',
    };
  if (score >= 70)
    return {
      stroke: 'stroke-yellow-500',
      text: 'text-yellow-600',
      glow: 'shadow-yellow-500/30',
      bg: 'bg-yellow-50',
    };
  if (score >= 40)
    return {
      stroke: 'stroke-orange-500',
      text: 'text-orange-600',
      glow: 'shadow-orange-500/30',
      bg: 'bg-orange-50',
    };
  return {
    stroke: 'stroke-red-500',
    text: 'text-red-600',
    glow: 'shadow-red-500/30',
    bg: 'bg-red-50',
  };
}

export function ReadinessScore({ score, totalRows, cleanRows }: ReadinessScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const colors = getScoreColor(score);

  // Animate the score on mount
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [score]);

  // SVG circle parameters
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* Circular progress */}
      <div
        className={cn('relative rounded-full shadow-lg', colors.glow)}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-gray-100"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={cn(colors.stroke, 'transition-all duration-300')}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn('text-4xl font-bold tracking-tight', colors.text)}
          >
            {animatedScore}%
          </span>
          <span className="text-xs font-medium text-gray-400">Readiness</span>
        </div>
      </div>

      {/* Summary text */}
      <p className="mt-4 text-sm text-gray-600">
        <strong className="font-semibold text-gray-900">
          {cleanRows.toLocaleString()}
        </strong>{' '}
        of{' '}
        <strong className="font-semibold text-gray-900">
          {totalRows.toLocaleString()}
        </strong>{' '}
        rows are clean
      </p>
    </div>
  );
}
