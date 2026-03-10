'use client';

import { WIZARD_STEPS } from '@/types';
import type { WizardPhase } from '@/types';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/components/ui/cn';

const PHASE_COLORS: Record<WizardPhase, { bg: string; text: string; border: string }> = {
  Setup:   { bg: 'bg-kn-blue/10',  text: 'text-kn-blue',  border: 'border-kn-blue/20' },
  Process: { bg: 'bg-kn-teal/10',  text: 'text-kn-teal',  border: 'border-kn-teal/20' },
  Enrich:  { bg: 'bg-amber-50',    text: 'text-amber-700', border: 'border-amber-200' },
  Export:  { bg: 'bg-emerald-50',   text: 'text-emerald-700', border: 'border-emerald-200' },
};

/**
 * Phase-grouped step wizard for 11 steps.
 * Steps are grouped into phases (Setup, Process, Enrich, Export)
 * with compact numbered circles.
 */
export function StepWizard() {
  const currentStep = useAppStore((s) => s.currentStep);
  const setStep = useAppStore((s) => s.setStep);

  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  // Group steps by phase
  const phases = WIZARD_STEPS.reduce<{ phase: WizardPhase; steps: typeof WIZARD_STEPS }[]>(
    (acc, step) => {
      const existing = acc.find((g) => g.phase === step.phase);
      if (existing) {
        existing.steps.push(step);
      } else {
        acc.push({ phase: step.phase, steps: [step] });
      }
      return acc;
    },
    [],
  );

  function handleStepClick(index: number) {
    if (index >= currentIndex) return;
    setStep(WIZARD_STEPS[index].id);
  }

  return (
    <nav
      className="sticky top-0 z-10 border-b border-gray-200 bg-white"
      aria-label="Wizard progress"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {phases.map((group, phaseIdx) => {
            const phaseColor = PHASE_COLORS[group.phase];
            const firstStepGlobalIdx = WIZARD_STEPS.findIndex(
              (s) => s.id === group.steps[0].id,
            );
            const lastStepGlobalIdx = firstStepGlobalIdx + group.steps.length - 1;
            const isPhaseActive = currentIndex >= firstStepGlobalIdx && currentIndex <= lastStepGlobalIdx;
            const isPhaseCompleted = currentIndex > lastStepGlobalIdx;

            return (
              <div key={group.phase} className="flex items-center gap-3 flex-1 min-w-0">
                {/* Phase group */}
                <div
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all',
                    isPhaseActive
                      ? `${phaseColor.bg} ${phaseColor.border} shadow-sm`
                      : isPhaseCompleted
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-100 bg-gray-50/50',
                  )}
                >
                  {/* Phase label */}
                  <span
                    className={cn(
                      'hidden text-[10px] font-bold uppercase tracking-wider lg:block',
                      isPhaseActive
                        ? phaseColor.text
                        : isPhaseCompleted
                          ? 'text-gray-500'
                          : 'text-gray-300',
                    )}
                  >
                    {group.phase}
                  </span>
                  <span className="hidden lg:block text-gray-200">|</span>

                  {/* Steps within phase */}
                  <div className="flex items-center gap-1">
                    {group.steps.map((step) => {
                      const globalIdx = WIZARD_STEPS.findIndex((s) => s.id === step.id);
                      const isCompleted = globalIdx < currentIndex;
                      const isCurrent = globalIdx === currentIndex;
                      const isFuture = globalIdx > currentIndex;

                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => handleStepClick(globalIdx)}
                          disabled={!isCompleted}
                          title={step.label}
                          className={cn(
                            'group relative flex items-center gap-1',
                            isCompleted && 'cursor-pointer',
                            isFuture && 'cursor-default',
                          )}
                        >
                          {/* Circle */}
                          <span
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                              isCompleted &&
                                'bg-kn-blue text-white group-hover:bg-kn-blue/80',
                              isCurrent &&
                                'bg-kn-teal text-white shadow shadow-kn-teal/30',
                              isFuture && 'bg-gray-200 text-gray-400',
                            )}
                          >
                            {isCompleted ? (
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              globalIdx + 1
                            )}
                          </span>
                          {/* Short label - only show for current step or on larger screens */}
                          <span
                            className={cn(
                              'text-[11px] font-medium whitespace-nowrap',
                              isCurrent
                                ? 'text-kn-teal block'
                                : isCompleted
                                  ? 'text-gray-500 hidden xl:block'
                                  : 'text-gray-300 hidden xl:block',
                            )}
                          >
                            {step.shortLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Phase connector */}
                {phaseIdx < phases.length - 1 && (
                  <div className="hidden h-0.5 w-4 flex-shrink-0 sm:block">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        isPhaseCompleted ? 'bg-kn-blue' : 'bg-gray-200',
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
