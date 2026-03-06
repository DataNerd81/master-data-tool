'use client';

import { useEffect } from 'react';
import { ArrowRight, ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useValidation } from '@/hooks/use-validation';
import { ReadinessScore } from '@/components/analysis/ReadinessScore';
import { ScoreBreakdown } from '@/components/analysis/ScoreBreakdown';
import { IssuesTable } from '@/components/analysis/IssuesTable';
import { BeforeAfter } from '@/components/analysis/BeforeAfter';
import { cn } from '@/components/ui/cn';

export function AnalysisStep() {
  const setStep = useAppStore((s) => s.setStep);
  const { validate, result, isValidating } = useValidation();

  useEffect(() => {
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBack() {
    setStep('mapping');
  }

  function handleContinue() {
    setStep('fixes');
  }

  if (isValidating || !result) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-kn-teal" />
        <p className="text-sm font-medium text-gray-700">
          Analysing your data...
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Running validation rules across all rows
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kn-teal/10">
          <BarChart3 className="h-6 w-6 text-kn-teal" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Analysis</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Review the quality of your data and see what needs to be fixed
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <ReadinessScore
          score={result.overallScore}
          totalRows={result.totalRows}
          cleanRows={result.cleanRows}
        />
      </div>

      {result.categoryScores.length > 0 && (
        <ScoreBreakdown categoryScores={result.categoryScores} />
      )}

      {result.issues.length > 0 && <BeforeAfter issues={result.issues} />}

      {result.issues.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold text-gray-900">
            All Issues
          </h3>
          <IssuesTable issues={result.issues} />
        </div>
      )}

      {result.issues.length === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="text-lg font-semibold text-emerald-800">
            Your data looks great!
          </p>
          <p className="mt-1 text-sm text-emerald-600">
            No issues were found. You can proceed to export your clean data.
          </p>
        </div>
      )}

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
            result.issues.length > 0
              ? 'bg-kn-teal text-white hover:bg-kn-teal/90 hover:shadow-md'
              : 'bg-kn-blue text-white hover:bg-kn-blue/90 hover:shadow-md',
          )}
        >
          {result.issues.length > 0
            ? 'View Fix Recommendations'
            : 'Continue to Export'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
