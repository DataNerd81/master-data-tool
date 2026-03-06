import { create } from 'zustand';
import type { ParsedWorkbook, DataRow } from '@/types';

// ---------------------------------------------------------------------------
// Data Store — parsed workbook, sheet selection, and active data rows
// ---------------------------------------------------------------------------

interface DataState {
  workbook: ParsedWorkbook | null;
  selectedSheets: string[];
  activeData: DataRow[];

  setWorkbook: (wb: ParsedWorkbook | null) => void;
  setSelectedSheets: (names: string[]) => void;
  setActiveData: (data: DataRow[]) => void;
  reset: () => void;
}

const initialState = {
  workbook: null as ParsedWorkbook | null,
  selectedSheets: [] as string[],
  activeData: [] as DataRow[],
};

export const useDataStore = create<DataState>()((set) => ({
  ...initialState,

  setWorkbook: (wb) => set({ workbook: wb }),

  setSelectedSheets: (names) => set({ selectedSheets: names }),

  setActiveData: (data) => set({ activeData: data }),

  reset: () => set(initialState),
}));
