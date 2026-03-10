'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useDataStore } from '@/stores/data-store';
import { cn } from '@/components/ui/cn';

/**
 * Step 8 — Assign Location to assets.
 * User can assign a location name/identifier to all assets,
 * or skip if not applicable.
 */
export function LocationStep() {
  const setStep = useAppStore((s) => s.setStep);
  const activeData = useDataStore((s) => s.activeData);
  const setActiveData = useDataStore((s) => s.setActiveData);
  const [wantsLocation, setWantsLocation] = useState<boolean | null>(null);
  const [locationName, setLocationName] = useState('');

  function handleBack() {
    setStep('sign-off');
  }

  function handleContinue() {
    // Apply location to every data row
    if (wantsLocation && locationName.trim()) {
      const updated = activeData.map((row) => ({
        ...row,
        Location: locationName.trim(),
      }));
      setActiveData(updated);
    }
    setStep('active-dates');
  }

  const canContinue = wantsLocation === false || (wantsLocation === true && locationName.trim() !== '');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
          <MapPin className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Assign Location
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
          Do you want to assign these assets to a certain location?
        </p>
      </div>

      {/* Yes / No selection */}
      <div className="mx-auto flex max-w-md gap-4">
        <button
          type="button"
          onClick={() => setWantsLocation(true)}
          className={cn(
            'flex-1 rounded-xl border-2 px-6 py-4 text-sm font-semibold transition-all',
            wantsLocation === true
              ? 'border-kn-teal bg-kn-teal/5 text-kn-teal shadow-md'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => {
            setWantsLocation(false);
            setLocationName('');
          }}
          className={cn(
            'flex-1 rounded-xl border-2 px-6 py-4 text-sm font-semibold transition-all',
            wantsLocation === false
              ? 'border-kn-teal bg-kn-teal/5 text-kn-teal shadow-md'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
          )}
        >
          No, skip this
        </button>
      </div>

      {/* Location input */}
      {wantsLocation === true && (
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <label htmlFor="location-name" className="mb-2 block text-sm font-semibold text-gray-800">
              Location Name / Identifier
            </label>
            <p className="mb-4 text-xs text-gray-500">
              Enter the location name or identifier. This will be applied to all
              assets in column 8.
            </p>
            <input
              id="location-name"
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Perth Office, Site A, Warehouse 3"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-kn-teal focus:outline-none focus:ring-2 focus:ring-kn-teal/20"
            />
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
