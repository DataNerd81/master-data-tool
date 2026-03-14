'use client';

import { WIZARD_STEPS } from '@/types';
import type { WizardPhase } from '@/types';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/components/ui/cn';

// Phase colours are now driven by completion state, not per-phase hue.
// See COMPLETED / INCOMPLETE constants below.

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
      <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {phases.map((group, phaseIdx) => {
            const firstStepGlobalIdx = WIZARD_STEPS.findIndex(
              (s) => s.id === group.steps[0].id,
            );
            const lastStepGlobalIdx = firstStepGlobalIdx + group.steps.length - 1;
            const isPhaseActive = currentIndex >= firstStepGlobalIdx && currentIndex <= lastStepGlobalIdx;
            const isPhaseCompleted = currentIndex > lastStepGlobalIdx;

            return (
              <div key={group.phase} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {/* Phase group */}
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-lg border px-1.5 py-1 sm:px-2 sm:py-1.5 transition-all',
                    isPhaseCompleted
                      ? 'border-step-parent-complete/40 bg-step-parent-complete shadow-sm'
                      : isPhaseActive
                        ? 'border-step-parent-incomplete/60 bg-step-parent-incomplete shadow-sm'
                        : 'border-gray-100 bg-gray-50/50',
                  )}
                >
                  {/* Phase label */}
                  <span
                    className={cn(
                      'hidden text-[9px] font-bold uppercase tracking-wider xl:block',
                      isPhaseCompleted || isPhaseActive
                        ? 'text-black'
                        : 'text-gray-300',
                    )}
                  >
                    {group.phase}
                  </span>
                  <span className="hidden xl:block text-gray-200 text-[10px]">|</span>

                  {/* Steps within phase */}
                  <div className="flex items-center gap-0.5">
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
                            'group relative flex items-center gap-0.5',
                            isCompleted && 'cursor-pointer',
                            isFuture && 'cursor-default',
                          )}
                        >
                          {/* Circle */}
                          <span
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all',
                              isCompleted &&
                                'bg-step-sub-complete text-black group-hover:bg-step-sub-complete/80',
                              isCurrent &&
                                'bg-step-sub-incomplete text-black shadow shadow-step-sub-incomplete/30',
                              isFuture && 'bg-gray-200 text-gray-400',
                            )}
                          >
                            {isCompleted ? (
                              <svg
                                className="h-3 w-3"
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
                          {/* Short label - only show for current step on md+, all labels on 2xl+ */}
                          <span
                            className={cn(
                              'text-[10px] font-medium whitespace-nowrap',
                              isCurrent
                                ? 'text-black hidden sm:block'
                                : isCompleted
                                  ? 'text-black hidden 2xl:block'
                                  : 'text-gray-300 hidden 2xl:block',
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
                  <div className="hidden h-0.5 w-2 flex-shrink-0 sm:block sm:w-3">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        isPhaseCompleted ? 'bg-step-parent-complete' : 'bg-gray-200',
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
