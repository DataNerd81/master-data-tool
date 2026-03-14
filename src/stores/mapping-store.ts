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
    set((state) => {
      // First, clear any existing mapping that already points to this target
      // (enforce 1:1 constraint — each target can only have one source)
      let updated = state.mappings.map((m) =>
        m.targetColumn === targetCol && targetCol !== null
          ? { ...m, targetColumn: null, confidence: 'unmapped' as const, score: 0 }
          : m,
      );

      // Check if there's an existing entry for this source column
      const existingIdx = updated.findIndex((m) => m.sourceColumn === sourceCol);

      if (existingIdx >= 0) {
        // Update the existing entry
        updated = updated.map((m, i) =>
          i === existingIdx
            ? {
                ...m,
                targetColumn: targetCol,
                confidence: targetCol ? ('exact' as const) : ('unmapped' as const),
                score: targetCol ? 1 : 0,
              }
            : m,
        );
      } else if (targetCol) {
        // Create a new mapping entry for this source -> target
        updated = [
          ...updated,
          {
            sourceColumn: sourceCol,
            targetColumn: targetCol,
            confidence: 'exact' as const,
            score: 1,
          },
        ];
      }

      return { mappings: updated };
    }),

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
