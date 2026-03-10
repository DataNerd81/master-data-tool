'use client';

import { ArrowRight, Truck, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { getSchemasByGroup } from '@/lib/schemas/registry';
import { cn } from '@/components/ui/cn';

const ICON_MAP: Record<string, React.ElementType> = {
  Truck,
  FileSpreadsheet,
};

/**
 * Step 1 — Select a mandatory field document (template).
 * Currently only Scope 1 Transport is available; more will be added.
 */
export function TemplateStep() {
  const setStep = useAppStore((s) => s.setStep);
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);
  const setTemplate = useAppStore((s) => s.setTemplate);

  const schemaGroups = getSchemasByGroup();

  function handleSelect(id: string) {
    setTemplate(id);
  }

  function handleContinue() {
    if (!selectedTemplateId) return;
    setStep('naming-convention');
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-kn-blue to-kn-teal shadow-lg shadow-kn-teal/20">
          <FileSpreadsheet className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Select Mandatory Field Document
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Choose the template that matches the data you need to prepare.
          Each template defines the mandatory columns and validation rules.
        </p>
      </div>

      {/* Template cards grouped by category */}
      <div className="mx-auto max-w-3xl space-y-6">
        {Array.from(schemaGroups.entries()).map(([group, schemas]) => (
          <div key={group}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
              {group}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {schemas.map((schema) => {
                const Icon = ICON_MAP[schema.icon] || FileSpreadsheet;
                const isSelected = selectedTemplateId === schema.id;

                return (
                  <button
                    key={schema.id}
                    type="button"
                    onClick={() => handleSelect(schema.id)}
                    className={cn(
                      'relative flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all',
                      isSelected
                        ? 'border-kn-teal bg-kn-teal/5 shadow-md shadow-kn-teal/10'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
                    )}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute right-3 top-3">
                        <CheckCircle2 className="h-5 w-5 text-kn-teal" />
                      </div>
                    )}

                    <div className={cn(
                      'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg',
                      isSelected ? 'bg-kn-teal/10' : 'bg-gray-100',
                    )}>
                      <Icon className={cn(
                        'h-5 w-5',
                        isSelected ? 'text-kn-teal' : 'text-gray-500',
                      )} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        'text-sm font-semibold',
                        isSelected ? 'text-kn-teal' : 'text-gray-800',
                      )}>
                        {schema.name}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                        {schema.description}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Coming soon placeholder */}
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-5">
                <p className="text-xs font-medium text-gray-400">
                  More templates coming soon
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Continue */}
      <div className="flex justify-center">
        <button
          type="button"
          disabled={!selectedTemplateId}
          onClick={handleContinue}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition-all duration-150',
            selectedTemplateId
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
