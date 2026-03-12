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
  /** Row indices the user has confirmed as correct (dismissed from review) */
  dismissedRows: Set<number>;

  setResult: (r: ValidationResult | null) => void;
  setValidating: (v: boolean) => void;
  setAutoDetectedCells: (cells: AutoDetectedCell[]) => void;
  /** Mark a row as confirmed/dismissed — removes its issues from review */
  dismissRow: (rowIndex: number) => void;
  /** Clear all dismissed rows (e.g. when data changes) */
  clearDismissedRows: () => void;
  reset: () => void;
}

const initialState = {
  result: null as ValidationResult | null,
  isValidating: false,
  autoDetectedCells: [] as AutoDetectedCell[],
  dismissedRows: new Set<number>(),
};

export const useValidationStore = create<ValidationState>()((set) => ({
  ...initialState,

  setResult: (r) => set({ result: r }),

  setValidating: (v) => set({ isValidating: v }),

  setAutoDetectedCells: (cells) => set({ autoDetectedCells: cells }),

  dismissRow: (rowIndex) =>
    set((state) => {
      const next = new Set(state.dismissedRows);
      next.add(rowIndex);
      return { dismissedRows: next };
    }),

  clearDismissedRows: () => set({ dismissedRows: new Set() }),

  reset: () => set(initialState),
}));
