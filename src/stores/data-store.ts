import { create } from 'zustand';
import type { ParsedWorkbook, DataRow } from '@/types';
import type { PreProcessResult } from '@/lib/transforms/pre-processor';

// ---------------------------------------------------------------------------
// Data Store — parsed workbook, sheet selection, and active data rows
// ---------------------------------------------------------------------------

export type PreProcessSummary = PreProcessResult['summary'];

interface DataState {
  workbook: ParsedWorkbook | null;
  selectedSheets: string[];
  activeData: DataRow[];
  preProcessSummary: PreProcessSummary | null;

  setWorkbook: (wb: ParsedWorkbook | null) => void;
  setSelectedSheets: (names: string[]) => void;
  setActiveData: (data: DataRow[]) => void;
  setPreProcessSummary: (summary: PreProcessSummary | null) => void;
  reset: () => void;
}

const initialState = {
  workbook: null as ParsedWorkbook | null,
  selectedSheets: [] as string[],
  activeData: [] as DataRow[],
  preProcessSummary: null as PreProcessSummary | null,
};

export const useDataStore = create<DataState>()((set) => ({
  ...initialState,

  setWorkbook: (wb) => set({ workbook: wb }),

  setSelectedSheets: (names) => set({ selectedSheets: names }),

  setActiveData: (data) => set({ activeData: data }),

  setPreProcessSummary: (summary) => set({ preProcessSummary: summary }),

  reset: () => set(initialState),
}));
