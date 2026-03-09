import { create } from 'zustand';
import type { ValidationResult } from '@/types';
import type { AutoDetectedCell } from '@/lib/mapping/auto-mapper';

// ---------------------------------------------------------------------------
// Validation Store — validation results, auto-detected cells, and loading state
// ---------------------------------------------------------------------------

interface ValidationState {
  result: ValidationResult | null;
  isValidating: boolean;
  /** Cells that were auto-populated by fuel type detection and need review */
  autoDetectedCells: AutoDetectedCell[];

  setResult: (r: ValidationResult | null) => void;
  setValidating: (v: boolean) => void;
  setAutoDetectedCells: (cells: AutoDetectedCell[]) => void;
  reset: () => void;
}

const initialState = {
  result: null as ValidationResult | null,
  isValidating: false,
  autoDetectedCells: [] as AutoDetectedCell[],
};

export const useValidationStore = create<ValidationState>()((set) => ({
  ...initialState,

  setResult: (r) => set({ result: r }),

  setValidating: (v) => set({ isValidating: v }),

  setAutoDetectedCells: (cells) => set({ autoDetectedCells: cells }),

  reset: () => set(initialState),
}));
