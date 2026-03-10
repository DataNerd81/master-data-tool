import { create } from 'zustand';
import type { WizardStep } from '@/types';

// ---------------------------------------------------------------------------
// App Store — wizard navigation and template selection
// ---------------------------------------------------------------------------

interface AppState {
  currentStep: WizardStep;
  selectedTemplateId: string | null;

  setStep: (step: WizardStep) => void;
  setTemplate: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'template' as WizardStep,
  selectedTemplateId: null as string | null,
};

export const useAppStore = create<AppState>()((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setTemplate: (id) => set({ selectedTemplateId: id }),

  reset: () => set(initialState),
}));
