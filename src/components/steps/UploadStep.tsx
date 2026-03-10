'use client';

import { ArrowRight, ArrowLeft, Sparkles, Truck } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useDataStore } from '@/stores/data-store';
import { DropZone } from '@/components/upload/DropZone';
import { SheetPicker } from '@/components/upload/SheetPicker';
import { cn } from '@/components/ui/cn';

export function UploadStep() {
  const setStep = useAppStore((s) => s.setStep);
  const workbook = useDataStore((s) => s.workbook);
  const selectedSheets = useDataStore((s) => s.selectedSheets);

  const canContinue = workbook !== null && selectedSheets.length > 0;

  function handleBack() {
    setStep('hierarchy');
  }

  function handleContinue() {
    if (!canContinue) return;
    setStep('scan-extract');
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-kn-blue to-kn-teal shadow-lg shadow-kn-teal/20">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Scope 1 Transport — Fuel Data Tool
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Upload your messy fuel data spreadsheet. The tool will find your regos,
          dates, fuel quantities, and automatically detect the fuel type and NGA
          category.
        </p>
      </div>

      {/* Template info banner */}
      <div className="mx-auto max-w-2xl rounded-xl border border-kn-teal/30 bg-kn-teal/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-kn-teal/10">
            <Truck className="h-5 w-5 text-kn-teal" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Scope 1 Transport Template
            </p>
            <p className="text-xs text-gray-500">
              Extracts: Rego/Asset Number, Data Entry Date, Fuel Quantity, Unit,
              NGA Category, NGA Fuel Type
            </p>
          </div>
        </div>
      </div>

      {/* Upload area */}
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <DropZone />
        </div>
      </div>

      {/* Sheet Picker (shown after upload) */}
      {workbook && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SheetPicker />
        </div>
      )}

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
          Continue to Scan
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
