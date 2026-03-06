'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useDataStore } from '@/stores/data-store';
import { TemplateSelector } from '@/components/upload/TemplateSelector';
import { DropZone } from '@/components/upload/DropZone';
import { SheetPicker } from '@/components/upload/SheetPicker';
import { cn } from '@/components/ui/cn';

export function UploadStep() {
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);
  const setStep = useAppStore((s) => s.setStep);
  const workbook = useDataStore((s) => s.workbook);
  const selectedSheets = useDataStore((s) => s.selectedSheets);

  const canContinue =
    selectedTemplateId !== null &&
    workbook !== null &&
    selectedSheets.length > 0;

  function handleContinue() {
    if (!canContinue) return;
    setStep('mapping');
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-kn-blue to-kn-teal shadow-lg shadow-kn-teal/20">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Welcome to the Master Data Tool
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Upload your Excel data, map it to a KubeNest template, and let the
          tool analyse, cleanse, and export your data ready for import.
        </p>
      </div>

      {/* Two-column: Template + Upload */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <TemplateSelector />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <DropZone />
        </div>
      </div>

      {/* Sheet Picker (shown after upload) */}
      {workbook && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SheetPicker />
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
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
          Continue to Mapping
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
