'use client';

import { ArrowRight, ArrowLeft, Wrench } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useFixes } from '@/hooks/use-fixes';
import { FixGroupList } from '@/components/fixes/FixGroupList';
import { cn } from '@/components/ui/cn';

export function FixesStep() {
  const setStep = useAppStore((s) => s.setStep);
  const { fixGroups, toggleFix, toggleAll, enabledFixes } = useFixes();

  function handleBack() {
    setStep('review-dashboard');
  }

  function handleContinue() {
    setStep('location');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
          <Wrench className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Fix Recommendations
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Review and select which automated fixes to apply to your data
          </p>
        </div>
      </div>

      <FixGroupList
        fixGroups={fixGroups}
        onToggle={toggleFix}
        onToggleAll={toggleAll}
      />

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
          onClick={handleContinue}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98]',
            enabledFixes.length > 0
              ? 'bg-kn-teal text-white hover:bg-kn-teal/90 hover:shadow-md'
              : 'bg-gray-200 text-gray-500',
          )}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
