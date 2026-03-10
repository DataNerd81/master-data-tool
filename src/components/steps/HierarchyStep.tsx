'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, GitBranch, Upload, FileText, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/components/ui/cn';

/**
 * Step 3 — Hierarchy Structure Document (optional).
 * User can upload a hierarchy structure document (Excel or Word)
 * or skip this step.
 */
export function HierarchyStep() {
  const setStep = useAppStore((s) => s.setStep);
  const [hasDoc, setHasDoc] = useState<boolean | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  function handleBack() {
    setStep('naming-convention');
  }

  function handleContinue() {
    setStep('upload');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  }

  function handleRemoveFile() {
    setUploadedFile(null);
  }

  const canContinue = hasDoc === false || (hasDoc === true && uploadedFile !== null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-kn-blue to-kn-teal shadow-lg shadow-kn-teal/20">
          <GitBranch className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Hierarchy Structure
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Do you have a standardised hierarchy structure document to follow?
        </p>
      </div>

      {/* Yes / No selection */}
      <div className="mx-auto flex max-w-md gap-4">
        <button
          type="button"
          onClick={() => setHasDoc(true)}
          className={cn(
            'flex-1 rounded-xl border-2 px-6 py-4 text-sm font-semibold transition-all',
            hasDoc === true
              ? 'border-kn-teal bg-kn-teal/5 text-kn-teal shadow-md'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
          )}
        >
          Yes, I have one
        </button>
        <button
          type="button"
          onClick={() => {
            setHasDoc(false);
            setUploadedFile(null);
          }}
          className={cn(
            'flex-1 rounded-xl border-2 px-6 py-4 text-sm font-semibold transition-all',
            hasDoc === false
              ? 'border-kn-teal bg-kn-teal/5 text-kn-teal shadow-md'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
          )}
        >
          No, skip this
        </button>
      </div>

      {/* Upload area (shown when Yes is selected) */}
      {hasDoc === true && (
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Upload Hierarchy Structure Document
            </h3>
            <p className="mb-4 text-xs text-gray-500">
              Upload an Excel (.xlsx, .xls) or Word (.docx) document with your
              standardised hierarchy structure.
            </p>

            {!uploadedFile ? (
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 transition-colors hover:border-kn-teal/50 hover:bg-kn-teal/5">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-400">
                  .xlsx, .xls, .docx
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.docx"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <FileText className="h-8 w-8 flex-shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
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
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
