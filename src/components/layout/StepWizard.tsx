'use client';

import { WIZARD_STEPS } from '@/types';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/components/ui/cn';

/**
 * Horizontal step-wizard indicator.
 * Shows progress through the 5 wizard stages. Users can click completed
 * steps to navigate backwards.
 */
export function StepWizard() {
  const currentStep = useAppStore((s) => s.currentStep);
  const setStep = useAppStore((s) => s.setStep);

  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  function handleStepClick(step: (typeof WIZARD_STEPS)[number], index: number) {
    if (index >= currentIndex) return;
    setStep(step.id);
  }

  return (
    <nav
      className="sticky top-0 z-10 border-b border-gray-200 bg-white"
      aria-label="Wizard progress"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <ol className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <li
                key={step.id}
                className="flex flex-1 items-center last:flex-none"
              >
                {/* Step circle + label */}
                <button
                  type="button"
                  onClick={() => handleStepClick(step, index)}
                  disabled={!isCompleted}
                  className={cn(
                    'group flex flex-col items-center gap-1.5',
                    isCompleted && 'cursor-pointer',
                    isFuture && 'cursor-default',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {/* Circle */}
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                      isCompleted &&
                        'border-kn-blue bg-kn-blue text-white group-hover:bg-kn-blue/90',
                      isCurrent &&
                        'border-kn-teal bg-kn-teal text-white shadow-md shadow-kn-teal/25',
                      isFuture && 'border-gray-300 bg-white text-gray-400',
                    )}
                  >
                    {isCompleted ? (
                      /* Checkmark SVG */
                      <svg
                        className="h-4 w-4"
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
                      index + 1
                    )}
                  </span>

                  {/* Label */}
                  <span
                    className={cn(
                      'hidden text-xs sm:block',
                      isCompleted && 'font-medium text-kn-blue',
                      isCurrent && 'font-bold text-kn-teal',
                      isFuture && 'font-normal text-gray-400',
                    )}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector line (not after last step) */}
                {index < WIZARD_STEPS.length - 1 && (
                  <div className="mx-2 hidden h-0.5 flex-1 sm:block">
                    <div
                      className={cn(
                        'h-full rounded-full transition-colors',
                        index < currentIndex ? 'bg-kn-blue' : 'bg-gray-200',
                      )}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
