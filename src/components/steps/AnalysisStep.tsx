'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  TableProperties,
  Loader2,
  AlertCircle,
  Copy,
  MinusCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useDataStore } from '@/stores/data-store';
import { useValidationStore } from '@/stores/validation-store';
import { useValidation } from '@/hooks/use-validation';
import { getSchema } from '@/lib/schemas/registry';
import { DataReviewTable, type IssueTab } from '@/components/analysis/DataReviewTable';
import { cn } from '@/components/ui/cn';
import type { CellValue } from '@/types';

export function AnalysisStep() {
  const setStep = useAppStore((s) => s.setStep);
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);
  const activeData = useDataStore((s) => s.activeData);
  const setActiveData = useDataStore((s) => s.setActiveData);
  const { validate, result, isValidating } = useValidation();
  const dismissRow = useValidationStore((s) => s.dismissRow);
  const clearDismissedRows = useValidationStore((s) => s.clearDismissedRows);
  const removeRow = useValidationStore((s) => s.removeRow);
  const removeRows = useValidationStore((s) => s.removeRows);
  const [verifiedTabs, setVerifiedTabs] = useState<Set<IssueTab>>(new Set());

  // Get the 7 schema column names in order
  const schemaColumns = useMemo(() => {
    if (!selectedTemplateId) return [];
    const schema = getSchema(selectedTemplateId);
    if (!schema) return [];
    return schema.columns.map((c) => c.name);
  }, [selectedTemplateId]);

  useEffect(() => {
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Summary counts
  const counts = useMemo(() => {
    if (!result) return { total: 0, clean: 0, missing: 0, duplicates: 0, negatives: 0, unsure: 0 };
    const missing = new Set<number>();
    const duplicates = new Set<number>();
    const negatives = new Set<number>();
    const unsure = new Set<number>();

    for (const issue of result.issues) {
      if (issue.category === 'required_fields') missing.add(issue.row);
      if (issue.category === 'duplicate') duplicates.add(issue.row);
      if (issue.category === 'data_type' && issue.severity === 'warning' && issue.message.includes('below minimum')) negatives.add(issue.row);
      if (issue.category === 'auto_detected') unsure.add(issue.row);
    }

    return {
      total: result.totalRows,
      clean: result.cleanRows,
      missing: missing.size,
      duplicates: duplicates.size,
      negatives: negatives.size,
      unsure: unsure.size,
    };
  }, [result]);

  // Auto-invalidate verified tabs if issues reappear after re-validation
  useEffect(() => {
    if (verifiedTabs.size === 0) return;
    const invalidated = new Set<IssueTab>();
    for (const tab of verifiedTabs) {
      const count = counts[tab as keyof typeof counts];
      if (typeof count === 'number' && count > 0) {
        invalidated.add(tab);
      }
    }
    if (invalidated.size > 0) {
      setVerifiedTabs((prev) => {
        const next = new Set(prev);
        for (const tab of invalidated) next.delete(tab);
        return next;
      });
    }
  }, [counts, verifiedTabs]);

  // Edit a cell inline — keeps verified sections that still have 0 issues
  const handleEditCell = useCallback(
    (rowIndex: number, column: string, newValue: CellValue) => {
      const updated = [...activeData];
      updated[rowIndex] = { ...updated[rowIndex], [column]: newValue };
      setActiveData(updated);
      setTimeout(() => validate(), 50);
    },
    [activeData, setActiveData, validate],
  );

  // Delete a row — also shifts auto-detected cells and dismissed rows so
  // stale indices don't cause phantom "unsure" rows to reappear.
  const handleDeleteRow = useCallback(
    (rowIndex: number) => {
      const updated = activeData.filter((_, i) => i !== rowIndex);
      setActiveData(updated);
      removeRow(rowIndex);
      setTimeout(() => validate(), 50);
    },
    [activeData, setActiveData, removeRow, validate],
  );

  // Delete multiple rows at once (e.g. all duplicates, all missing-data rows)
  const handleDeleteAllFiltered = useCallback(
    (rowIndices: number[]) => {
      if (rowIndices.length === 0) return;
      const toRemove = new Set(rowIndices);
      const updated = activeData.filter((_, i) => !toRemove.has(i));
      setActiveData(updated);
      removeRows(rowIndices);
      setTimeout(() => validate(), 50);
    },
    [activeData, setActiveData, removeRows, validate],
  );

  // Confirm a row is correct — dismiss its issues from review
  const handleDismissRow = useCallback(
    (rowIndex: number) => {
      dismissRow(rowIndex);
      setTimeout(() => validate(), 50);
    },
    [dismissRow, validate],
  );

  // Verify a specific tab — re-run validation and mark tab as verified
  const handleVerify = useCallback((tab: IssueTab) => {
    validate();
    setVerifiedTabs((prev) => {
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, [validate]);

  function handleBack() {
    setStep('scan-extract');
  }

  function handleContinue() {
    setStep('sign-off');
  }

  if (isValidating || !result) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-kn-teal" />
        <p className="text-sm font-medium text-gray-700">
          Analysing your data...
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Scanning for missing data, duplicates, and mapping fuel types
        </p>
      </div>
    );
  }

  const hasIssues = counts.missing > 0 || counts.duplicates > 0 || counts.negatives > 0 || counts.unsure > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kn-teal/10">
          <TableProperties className="h-6 w-6 text-kn-teal" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Your Data</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {counts.total.toLocaleString()} rows loaded across 7 columns.
            Review flagged issues below — double-click any cell to edit, or delete entire rows.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Clean Rows */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Clean Rows
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {counts.clean.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">
            of {counts.total.toLocaleString()} total
          </p>
        </div>

        {/* Missing Data */}
        <div className={cn(
          'rounded-xl border p-4 shadow-sm',
          verifiedTabs.has('missing') && counts.missing === 0 ? 'border-emerald-200 bg-emerald-50' :
          counts.missing > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white',
        )}>
          <div className="flex items-center gap-2">
            {verifiedTabs.has('missing') && counts.missing === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertCircle className={cn('h-5 w-5', counts.missing > 0 ? 'text-red-500' : 'text-gray-300')} />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Missing Data
            </span>
          </div>
          <p className={cn('mt-2 text-2xl font-bold',
            verifiedTabs.has('missing') && counts.missing === 0 ? 'text-emerald-700' :
            counts.missing > 0 ? 'text-red-700' : 'text-gray-900',
          )}>
            {verifiedTabs.has('missing') && counts.missing === 0 ? 'Verified' : counts.missing}
          </p>
          <p className="text-xs text-gray-400">
            {verifiedTabs.has('missing') && counts.missing === 0 ? 'section confirmed' : 'rows with empty fields'}
          </p>
        </div>

        {/* Duplicates */}
        <div className={cn(
          'rounded-xl border p-4 shadow-sm',
          verifiedTabs.has('duplicates') && counts.duplicates === 0 ? 'border-emerald-200 bg-emerald-50' :
          counts.duplicates > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white',
        )}>
          <div className="flex items-center gap-2">
            {verifiedTabs.has('duplicates') && counts.duplicates === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Copy className={cn('h-5 w-5', counts.duplicates > 0 ? 'text-amber-500' : 'text-gray-300')} />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Duplicates
            </span>
          </div>
          <p className={cn('mt-2 text-2xl font-bold',
            verifiedTabs.has('duplicates') && counts.duplicates === 0 ? 'text-emerald-700' :
            counts.duplicates > 0 ? 'text-amber-700' : 'text-gray-900',
          )}>
            {verifiedTabs.has('duplicates') && counts.duplicates === 0 ? 'Verified' : counts.duplicates}
          </p>
          <p className="text-xs text-gray-400">
            {verifiedTabs.has('duplicates') && counts.duplicates === 0 ? 'section confirmed' : 'duplicate rows found'}
          </p>
        </div>

        {/* Negative Qty */}
        <div className={cn(
          'rounded-xl border p-4 shadow-sm',
          verifiedTabs.has('negatives') && counts.negatives === 0 ? 'border-emerald-200 bg-emerald-50' :
          counts.negatives > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white',
        )}>
          <div className="flex items-center gap-2">
            {verifiedTabs.has('negatives') && counts.negatives === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <MinusCircle className={cn('h-5 w-5', counts.negatives > 0 ? 'text-orange-500' : 'text-gray-300')} />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Negative Qty
            </span>
          </div>
          <p className={cn('mt-2 text-2xl font-bold',
            verifiedTabs.has('negatives') && counts.negatives === 0 ? 'text-emerald-700' :
            counts.negatives > 0 ? 'text-orange-700' : 'text-gray-900',
          )}>
            {verifiedTabs.has('negatives') && counts.negatives === 0 ? 'Verified' : counts.negatives}
          </p>
          <p className="text-xs text-gray-400">
            {verifiedTabs.has('negatives') && counts.negatives === 0 ? 'section confirmed' : 'rows with negative values'}
          </p>
        </div>

        {/* Unsure / N/A */}
        <div className={cn(
          'rounded-xl border p-4 shadow-sm',
          verifiedTabs.has('unsure') && counts.unsure === 0 ? 'border-emerald-200 bg-emerald-50' :
          counts.unsure > 0 ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-white',
        )}>
          <div className="flex items-center gap-2">
            {verifiedTabs.has('unsure') && counts.unsure === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <HelpCircle className={cn('h-5 w-5', counts.unsure > 0 ? 'text-purple-500' : 'text-gray-300')} />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Unsure / N/A
            </span>
          </div>
          <p className={cn('mt-2 text-2xl font-bold',
            verifiedTabs.has('unsure') && counts.unsure === 0 ? 'text-emerald-700' :
            counts.unsure > 0 ? 'text-purple-700' : 'text-gray-900',
          )}>
            {verifiedTabs.has('unsure') && counts.unsure === 0 ? 'Verified' : counts.unsure}
          </p>
          <p className="text-xs text-gray-400">
            {verifiedTabs.has('unsure') && counts.unsure === 0 ? 'section confirmed' : 'auto-detected, verify'}
          </p>
        </div>
      </div>

      {/* Data Table with Tabs */}
      <DataReviewTable
        data={activeData}
        issues={result.issues}
        columns={schemaColumns}
        onEditCell={handleEditCell}
        onDeleteRow={handleDeleteRow}
        onDeleteAllFiltered={handleDeleteAllFiltered}
        onDismissRow={handleDismissRow}
        onVerify={handleVerify}
        verifiedTabs={verifiedTabs}
      />

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
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98]',
            hasIssues
              ? 'bg-kn-teal text-white hover:bg-kn-teal/90 hover:shadow-md'
              : 'bg-kn-blue text-white hover:bg-kn-blue/90 hover:shadow-md',
          )}
        >
          {hasIssues ? 'Continue with Issues' : 'Continue'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
