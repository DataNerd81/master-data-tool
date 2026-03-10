'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/components/ui/cn';

/**
 * Step 9 — Active Dates for assets.
 * User enters an active date that auto-fills all data rows.
 */
export function ActiveDatesStep() {
  const setStep = useAppStore((s) => s.setStep);
  const [activeDate, setActiveDate] = useState('');

  function handleBack() {
    setStep('location');
  }

  function handleContinue() {
    // TODO: Apply active date to data rows when fully implemented
    setStep('pre-2004');
  }

  const canContinue = activeDate.trim() !== '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
          <Calendar className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Active Dates
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
          What are the active dates for all these assets? This will auto-fill
          across all data rows.
        </p>
      </div>

      {/* Date input */}
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <label htmlFor="active-date" className="mb-2 block text-sm font-semibold text-gray-800">
            Active Date
          </label>
          <p className="mb-4 text-xs text-gray-500">
            Enter the active date for all assets. This date will be applied to
            every row in your data.
          </p>
          <input
            id="active-date"
            type="date"
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 transition-colors focus:border-kn-teal focus:outline-none focus:ring-2 focus:ring-kn-teal/20"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition-all duration-150',
            canContinue
              ? 'bg-kn-teal text-white hover:bg-kn-teal/90 hover:shadow-md active:scale-[0.98]'
              : 'cursor-not-allowed bg-gray-200 text-gray-400',
          )}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
