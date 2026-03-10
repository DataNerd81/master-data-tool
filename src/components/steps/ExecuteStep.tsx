'use client';

import { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useDataStore } from '@/stores/data-store';
import { useMappingStore } from '@/stores/mapping-store';
import { useValidationStore } from '@/stores/validation-store';
import { useFixesStore } from '@/stores/fixes-store';
import { useExport } from '@/hooks/use-export';
import { useValidation } from '@/hooks/use-validation';
import { useFixes } from '@/hooks/use-fixes';
import { getSchema } from '@/lib/schemas/registry';
import { ExecuteSummary } from '@/components/execute/ExecuteSummary';
import { ProgressBar } from '@/components/execute/ProgressBar';
import { ReadinessScore } from '@/components/analysis/ReadinessScore';
import { cn } from '@/components/ui/cn';

export function ExecuteStep() {
  const setStep = useAppStore((s) => s.setStep);
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);
  const { applyFixes, downloadFile, isExporting } = useExport();
  const { validate, result: validationResult } = useValidation();
  const { enabledFixes } = useFixes();
  const executionProgress = useFixesStore((s) => s.executionProgress);

  const [hasExecuted, setHasExecuted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Build the filename for display
  const fileName = (() => {
    if (!selectedTemplateId) return 'cleaned-data.xlsx';
    const schema = getSchema(selectedTemplateId);
    if (!schema) return 'cleaned-data.xlsx';
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}.xlsx`;
  })();

  function handleBack() {
    setStep('pre-2004');
  }

  function handleStartOver() {
    useAppStore.getState().reset();
    useDataStore.getState().reset();
    useMappingStore.getState().reset();
    useValidationStore.getState().reset();
    useFixesStore.getState().reset();
  }

  const handleExecute = useCallback(() => {
    setIsRunning(true);
    applyFixes();

    const checkComplete = setInterval(() => {
      const progress = useFixesStore.getState().executionProgress;
      if (progress >= 100) {
        clearInterval(checkComplete);
        setIsRunning(false);
        setHasExecuted(true);
        validate();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkComplete);
      setIsRunning(false);
      setHasExecuted(true);
    }, 30000);
  }, [applyFixes, validate]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kn-blue/10">
          <Play className="h-6 w-6 text-kn-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Execute &amp; Export
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Apply selected fixes and download your cleaned data
          </p>
        </div>
      </div>

      {!hasExecuted && !isRunning && (
        <>
          <ExecuteSummary enabledGroups={enabledFixes} />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleExecute}
              disabled={enabledFixes.length === 0}
              className={cn(
                'inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold shadow-md transition-all',
                enabledFixes.length > 0
                  ? 'bg-kn-teal text-white hover:bg-kn-teal/90 hover:shadow-lg active:scale-[0.98]'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400',
              )}
            >
              <Play className="h-5 w-5" />
              Execute All Changes
            </button>
          </div>
        </>
      )}

      {isRunning && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <ProgressBar progress={executionProgress} />
        </div>
      )}

      {hasExecuted && !isRunning && (
        <>
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-emerald-800">
                Changes Applied Successfully
              </h2>
              <p className="mt-1 text-sm text-emerald-600">
                All selected fixes have been applied. Download your cleaned file
                below.
              </p>
            </div>
          </div>

          {validationResult && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="mb-4 text-center text-base font-semibold text-gray-900">
                Updated Readiness Score
              </h3>
              <ReadinessScore
                score={validationResult.overallScore}
                totalRows={validationResult.totalRows}
                cleanRows={validationResult.cleanRows}
              />
            </div>
          )}

          {/* Download Section — separate from execution */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={isExporting}
              onClick={downloadFile}
              className={cn(
                'inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold shadow-md transition-all',
                isExporting
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-kn-blue text-white hover:bg-kn-blue/90 hover:shadow-lg active:scale-[0.98]',
              )}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download Cleaned File
                </>
              )}
            </button>
            <p className="text-xs text-gray-500">
              Will download as{' '}
              <span className="font-medium text-gray-700">{fileName}</span>
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleStartOver}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Start Over
            </button>
          </div>
        </>
      )}

      {!hasExecuted && !isRunning && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      )}
    </div>
  );
}
