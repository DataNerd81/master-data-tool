'use client';

import { useMemo } from 'react';
import { Wand2, Save, FolderOpen } from 'lucide-react';
import { useMapping } from '@/hooks/use-mapping';
import { useAppStore } from '@/stores/app-store';
import { useDataStore } from '@/stores/data-store';
import { getSchema } from '@/lib/schemas/registry';
import { MappingRow, type PreProcessedHint } from './MappingRow';
import { cn } from '@/components/ui/cn';
import type { CellValue } from '@/types';

export function ColumnMapper() {
  const { autoMap, mappings, updateMapping, saveMappings, loadMappings } =
    useMapping();
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);
  const workbook = useDataStore((s) => s.workbook);
  const selectedSheets = useDataStore((s) => s.selectedSheets);
  const preProcessSummary = useDataStore((s) => s.preProcessSummary);

  const schema = useMemo(
    () => (selectedTemplateId ? getSchema(selectedTemplateId) : undefined),
    [selectedTemplateId],
  );

  // Collect all headers from selected sheets
  const sourceHeaders = useMemo(() => {
    if (!workbook) return [];
    const headersSet = new Set<string>();
    for (const sheetName of selectedSheets) {
      const sheet = workbook.sheets.find((s) => s.name === sheetName);
      if (sheet) {
        for (const header of sheet.headers) {
          headersSet.add(header);
        }
      }
    }
    return Array.from(headersSet);
  }, [workbook, selectedSheets]);

  // Build a map from source column to sample values
  const sampleMap = useMemo(() => {
    if (!workbook) return new Map<string, CellValue[]>();
    const map = new Map<string, CellValue[]>();
    for (const sheetName of selectedSheets) {
      const sheet = workbook.sheets.find((s) => s.name === sheetName);
      if (!sheet) continue;
      for (const header of sheet.headers) {
        if (map.has(header)) continue;
        const samples: CellValue[] = [];
        for (let i = 0; i < Math.min(3, sheet.data.length); i++) {
          const val = sheet.data[i]?.[header];
          if (val !== null && val !== undefined && val !== '') {
            samples.push(val);
          }
        }
        map.set(header, samples);
      }
    }
    return map;
  }, [workbook, selectedSheets]);

  // Compute mapping statistics
  const stats = useMemo(() => {
    if (!schema) return { total: 0, mapped: 0, requiredTotal: 0, requiredMapped: 0 };
    const total = schema.columns.length;
    const mapped = mappings.filter(
      (m) => m.targetColumn !== null,
    ).length;
    const requiredCols = schema.columns.filter((c) => c.required);
    const requiredTotal = requiredCols.length;
    const mappedTargets = new Set(
      mappings.filter((m) => m.targetColumn !== null).map((m) => m.targetColumn),
    );
    const requiredMapped = requiredCols.filter((c) =>
      mappedTargets.has(c.name),
    ).length;
    return { total, mapped, requiredTotal, requiredMapped };
  }, [schema, mappings]);

  // Build pre-processed hints for fields the pre-processor injected
  const preProcessedHints = useMemo(() => {
    const hints = new Map<string, PreProcessedHint>();

    // NGA Category and Fuel Type are always auto-detected (regardless of pre-processing)
    hints.set('Category (from NGA table on right)', {
      message: 'Will be auto-detected from your data',
      detail: 'We\'ll scan for keywords like "diesel", "petrol", "unleaded" and map them to the correct NGA category.',
    });
    hints.set('Fuel Type (from NGA table on right)', {
      message: 'Will be auto-detected from your data',
      detail: 'Fuel types will be inferred from product descriptions in your spreadsheet.',
    });

    if (!preProcessSummary) return hints;

    // Rego was extracted from section headers
    if (preProcessSummary.regosFound.length > 0) {
      const regos = preProcessSummary.regosFound.join(', ');
      hints.set('Rego or Asset Number', {
        message: `Found ${preProcessSummary.regosFound.length} rego${preProcessSummary.regosFound.length !== 1 ? 's' : ''} in your data`,
        detail: `Your regos aren't in a clear column, but we extracted them from the section headers: ${regos}`,
      });
    }

    // Unit was defaulted to "L"
    if (preProcessSummary.unitDefaulted) {
      hints.set('Unit (Litres or Kl etc)', {
        message: 'Defaulted to Litres (L)',
        detail: 'No unit column was found in your data, so we\'ve set it to Litres. You can change this if needed.',
      });
    }

    return hints;
  }, [preProcessSummary]);

  if (!schema) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">No template selected. Please go back to the Upload step.</p>
      </div>
    );
  }

  function handleChangeMapping(schemaColName: string, sourceColumn: string | null) {
    // Find existing mapping that targets this schema column, or find by source
    // We need to route through mapping store's updateMapping
    // First, find if there is already a mapping whose sourceColumn is sourceColumn
    // and update it. Otherwise create new.
    if (sourceColumn) {
      updateMapping(sourceColumn, schemaColName);
    } else {
      // Find the current source mapped to this schema column and unmap it
      const existing = mappings.find((m) => m.targetColumn === schemaColName);
      if (existing) {
        updateMapping(existing.sourceColumn, null);
      }
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            <strong className="font-semibold text-gray-900">{stats.mapped}</strong>
            /{stats.total} columns mapped
          </span>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span>
            <strong
              className={cn(
                'font-semibold',
                stats.requiredMapped === stats.requiredTotal
                  ? 'text-emerald-600'
                  : 'text-amber-600',
              )}
            >
              {stats.requiredMapped}
            </strong>
            /{stats.requiredTotal} required fields
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadMappings()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Load Saved
          </button>
          <button
            type="button"
            onClick={saveMappings}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
          <button
            type="button"
            onClick={autoMap}
            className="inline-flex items-center gap-1.5 rounded-lg bg-kn-blue px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-kn-blue/90"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Auto-Map
          </button>
        </div>
      </div>

      {/* Mapping Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                KubeNest Field
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Your Column
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Confidence
              </th>
              <th className="px-3 py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Sample Values
              </th>
            </tr>
          </thead>
          <tbody>
            {schema.columns.map((col) => {
              // Find the mapping that targets this schema column
              const mapping = mappings.find(
                (m) => m.targetColumn === col.name,
              );
              const samples = mapping?.sourceColumn
                ? sampleMap.get(mapping.sourceColumn) ?? []
                : [];

              const hint = preProcessedHints.get(col.name);

              return (
                <MappingRow
                  key={col.name}
                  schemaColumn={col}
                  mapping={mapping}
                  sourceHeaders={sourceHeaders}
                  sampleValues={samples}
                  onChangeMapping={(sourceCol) =>
                    handleChangeMapping(col.name, sourceCol)
                  }
                  preProcessedHint={hint}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
