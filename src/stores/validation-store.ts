import { create } from 'zustand';
import type { ValidationResult } from '@/types';

// ---------------------------------------------------------------------------
// Validation Store — validation results and loading state
// ---------------------------------------------------------------------------

interface ValidationState {
  result: ValidationResult | null;
  isValidating: boolean;

  setResult: (r: ValidationResult | null) => void;
  setValidating: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  result: null as ValidationResult | null,
  isValidating: false,
};

export const useValidationStore = create<ValidationState>()((set) => ({
  ...initialState,

  setResult: (r) => set({ result: r }),

  setValidating: (v) => set({ isValidating: v }),

  reset: () => set(initialState),
}));
