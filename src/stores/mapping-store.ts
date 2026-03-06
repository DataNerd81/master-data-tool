import { create } from 'zustand';
import type { ColumnMapping, DataRow } from '@/types';
import { useDataStore } from './data-store';

// ---------------------------------------------------------------------------
// Mapping Store — column mappings between source and target schema
// ---------------------------------------------------------------------------

interface MappingState {
  mappings: ColumnMapping[];

  setMappings: (m: ColumnMapping[]) => void;
  updateMapping: (sourceCol: string, targetCol: string | null) => void;
  reset: () => void;

  /** Returns activeData with columns renamed according to current mappings. */
  getMappedData: () => DataRow[];
}

const initialState = {
  mappings: [] as ColumnMapping[],
};

export const useMappingStore = create<MappingState>()((set, get) => ({
  ...initialState,

  setMappings: (m) => set({ mappings: m }),

  updateMapping: (sourceCol, targetCol) =>
    set((state) => ({
      mappings: state.mappings.map((m) =>
        m.sourceColumn === sourceCol
          ? {
              ...m,
              targetColumn: targetCol,
              confidence: targetCol ? 'exact' : 'unmapped',
              score: targetCol ? 1 : 0,
            }
          : m,
      ),
    })),

  reset: () => set(initialState),

  getMappedData: () => {
    const { mappings } = get();
    const activeData = useDataStore.getState().activeData;

    // Build a lookup from source column name -> target column name
    const columnMap = new Map<string, string>();
    for (const mapping of mappings) {
      if (mapping.targetColumn) {
        columnMap.set(mapping.sourceColumn, mapping.targetColumn);
      }
    }

    return activeData.map((row) => {
      const newRow: DataRow = {};
      for (const [key, value] of Object.entries(row)) {
        const targetName = columnMap.get(key);
        if (targetName) {
          newRow[targetName] = value;
        } else {
          // Keep unmapped columns with original names
          newRow[key] = value;
        }
      }
      return newRow;
    });
  },
}));
