'use client';

import { useMemo } from 'react';
import { ArrowRight, ArrowLeft, Columns3, Fuel } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { getSchema } from '@/lib/schemas/registry';
import { useMapping } from '@/hooks/use-mapping';
import { ColumnMapper } from '@/components/mapping/ColumnMapper';

export function MappingStep() {
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);
  const setStep = useAppStore((s) => s.setStep);
  const { autoDetectFuelTypes } = useMapping();

  const schema = useMemo(
    () => (selectedTemplateId ? getSchema(selectedTemplateId) : undefined),
    [selectedTemplateId],
  );

  function handleBack() {
    setStep('upload');
  }

  function handleContinue() {
    // Run fuel type auto-detection before proceeding to review
    autoDetectFuelTypes();
    setStep('review-dashboard');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kn-purple/10">
          <Columns3 className="h-6 w-6 text-kn-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Map Your Columns</h1>
          {schema && (
            <p className="mt-0.5 text-sm text-gray-500">
              Map your messy spreadsheet columns to the{' '}
              <strong className="font-semibold text-gray-700">
                {schema.name}
              </strong>{' '}
              template. Fuel types will be auto-detected from your data.
            </p>
          )}
        </div>
      </div>

      {/* NGA auto-mapping info */}
      <div className="rounded-xl border border-kn-blue/20 bg-kn-blue/5 p-4">
        <div className="flex items-start gap-3">
          <Fuel className="mt-0.5 h-5 w-5 flex-shrink-0 text-kn-blue" />
          <div>
            <p className="text-sm font-medium text-kn-blue">
              Map your 5 columns below
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              Map each of your spreadsheet columns to the 5 fields below.
              When you click &quot;Run Analysis&quot;, the tool will use your{' '}
              <strong>Products used/Fuel type</strong> column to automatically
              determine the NGA Category and NGA Fuel Type, giving you a
              final output of 7 columns.
            </p>
          </div>
        </div>
      </div>

      {/* Column Mapper */}
      <ColumnMapper />

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
          onClick={handleContinue}
          className="inline-flex items-center gap-2 rounded-xl bg-kn-teal px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-kn-teal/90 hover:shadow-md active:scale-[0.98]"
        >
          Run Analysis
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
