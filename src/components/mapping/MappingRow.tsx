'use client';

import { ChevronDown, Sparkles } from 'lucide-react';
import type { ColumnDef, ColumnMapping, CellValue } from '@/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { cn } from '@/components/ui/cn';

export interface PreProcessedHint {
  message: string;
  detail: string;
}

interface MappingRowProps {
  schemaColumn: ColumnDef;
  mapping: ColumnMapping | undefined;
  sourceHeaders: string[];
  sampleValues: CellValue[];
  onChangeMapping: (targetColumn: string | null) => void;
  preProcessedHint?: PreProcessedHint;
}

function formatSample(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export function MappingRow({
  schemaColumn,
  mapping,
  sourceHeaders,
  sampleValues,
  onChangeMapping,
  preProcessedHint,
}: MappingRowProps) {
  const isMapped = mapping?.targetColumn !== null && mapping?.targetColumn !== undefined;
  const confidence = mapping?.confidence ?? 'unmapped';

  return (
    <tr className={cn(
      'border-b border-gray-100 transition-colors',
      preProcessedHint ? 'bg-kn-teal/5 hover:bg-kn-teal/10' : 'hover:bg-gray-50/50',
    )}>
      {/* KubeNest Field */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {schemaColumn.name}
          </span>
          {schemaColumn.required && (
            <span className="inline-flex items-center rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 ring-1 ring-inset ring-red-500/20">
              Required
            </span>
          )}
        </div>
        {schemaColumn.description && (
          <p className="mt-0.5 text-xs text-gray-400">
            {schemaColumn.description}
          </p>
        )}
      </td>

      {/* Your Column (dropdown or pre-processed hint) */}
      <td className="px-3 py-3">
        {preProcessedHint ? (
          <div className="flex items-start gap-2 rounded-lg border border-kn-teal/30 bg-kn-teal/10 px-3 py-2">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-kn-teal" />
            <div>
              <p className="text-sm font-medium text-kn-teal">
                {preProcessedHint.message}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {preProcessedHint.detail}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <select
              value={mapping?.sourceColumn ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                onChangeMapping(val || null);
              }}
              className={cn(
                'w-full appearance-none rounded-lg border bg-white py-2 pl-3 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-kn-teal/30',
                isMapped
                  ? 'border-gray-300 text-gray-900'
                  : 'border-gray-200 text-gray-400',
              )}
            >
              <option value="">-- Select column --</option>
              {sourceHeaders.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        )}
      </td>

      {/* Confidence */}
      <td className="px-3 py-3">
        {preProcessedHint ? (
          <span className="inline-flex items-center rounded-full bg-kn-teal/15 px-2.5 py-0.5 text-xs font-semibold text-kn-teal">
            Auto-Extracted
          </span>
        ) : (
          <ConfidenceBadge
            confidence={confidence}
            isOptional={!schemaColumn.required}
          />
        )}
      </td>

      {/* Sample Values */}
      <td className="px-3 py-3 pr-4">
        {isMapped && sampleValues.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {sampleValues.slice(0, 3).map((val, i) => (
              <span
                key={i}
                className={cn(
                  'inline-block max-w-[140px] truncate rounded px-2 py-0.5 text-xs',
                  preProcessedHint
                    ? 'bg-kn-teal/15 text-kn-teal font-medium'
                    : 'bg-gray-100 text-gray-600',
                )}
                title={formatSample(val)}
              >
                {formatSample(val) || '(empty)'}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-300">No data</span>
        )}
      </td>
    </tr>
  );
}
