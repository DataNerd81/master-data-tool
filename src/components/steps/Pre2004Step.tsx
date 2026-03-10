'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useDataStore } from '@/stores/data-store';
import { cn } from '@/components/ui/cn';

/**
 * Step 10 — Pre-2004 Asset Flagging.
 * User indicates whether any assets were built before 2004,
 * and selects which ones if so.
 */
export function Pre2004Step() {
  const setStep = useAppStore((s) => s.setStep);
  const activeData = useDataStore((s) => s.activeData);

  const [hasPre2004, setHasPre2004] = useState<boolean | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // Extract unique rego/asset numbers from data
  const uniqueAssets = useMemo(() => {
    if (!activeData?.length) return [];
    const regoCol = 'Rego/Asset Number/Identifier';
    const assets = new Set<string>();
    for (const row of activeData) {
      const val = row[regoCol];
      if (val && String(val).trim()) {
        assets.add(String(val).trim());
      }
    }
    return Array.from(assets).sort();
  }, [activeData]);

  function handleBack() {
    setStep('active-dates');
  }

  function handleContinue() {
    // TODO: Apply pre-2004 flag to selected assets when fully implemented
    setStep('final-export');
  }

  function toggleAsset(asset: string) {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(asset)) {
        next.delete(asset);
      } else {
        next.add(asset);
      }
      return next;
    });
  }

  const canContinue = hasPre2004 === false || (hasPre2004 === true && selectedAssets.size > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
          <Clock className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Pre-2004 Assets
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Do you have any assets built before 2004?
        </p>
      </div>

      {/* Yes / No selection */}
      <div className="mx-auto flex max-w-md gap-4">
        <button
          type="button"
          onClick={() => setHasPre2004(true)}
          className={cn(
            'flex-1 rounded-xl border-2 px-6 py-4 text-sm font-semibold transition-all',
            hasPre2004 === true
              ? 'border-kn-teal bg-kn-teal/5 text-kn-teal shadow-md'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => {
            setHasPre2004(false);
            setSelectedAssets(new Set());
          }}
          className={cn(
            'flex-1 rounded-xl border-2 px-6 py-4 text-sm font-semibold transition-all',
            hasPre2004 === false
              ? 'border-kn-teal bg-kn-teal/5 text-kn-teal shadow-md'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
          )}
        >
          No
        </button>
      </div>

      {/* Asset selection */}
      {hasPre2004 === true && (
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Select Pre-2004 Assets
            </h3>
            <p className="mb-4 text-xs text-gray-500">
              Select the assets that were built before 2004.
            </p>

            {uniqueAssets.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No assets found in data. Please go back and upload your data first.
              </p>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {uniqueAssets.map((asset) => (
                  <label
                    key={asset}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition-all',
                      selectedAssets.has(asset)
                        ? 'border-kn-teal bg-kn-teal/5'
                        : 'border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssets.has(asset)}
                      onChange={() => toggleAsset(asset)}
                      className="h-4 w-4 rounded border-gray-300 text-kn-teal focus:ring-kn-teal"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {asset}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {selectedAssets.size > 0 && (
              <p className="mt-3 text-xs text-kn-teal font-medium">
                {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
              </p>
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
          Continue to Export
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
