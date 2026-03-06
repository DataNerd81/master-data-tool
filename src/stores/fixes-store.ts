import { create } from 'zustand';
import type { FixGroup } from '@/types';

// ---------------------------------------------------------------------------
// Fixes Store — fix groups, execution state, and progress
// ---------------------------------------------------------------------------

interface FixesState {
  fixGroups: FixGroup[];
  isExecuting: boolean;
  executionProgress: number; // 0-100

  setFixGroups: (groups: FixGroup[]) => void;
  toggleFixGroup: (id: string) => void;
  toggleAll: (enabled: boolean) => void;
  setExecuting: (v: boolean) => void;
  setProgress: (n: number) => void;
  reset: () => void;
}

const initialState = {
  fixGroups: [] as FixGroup[],
  isExecuting: false,
  executionProgress: 0,
};

export const useFixesStore = create<FixesState>()((set) => ({
  ...initialState,

  setFixGroups: (groups) => set({ fixGroups: groups }),

  toggleFixGroup: (id) =>
    set((state) => ({
      fixGroups: state.fixGroups.map((g) =>
        g.id === id ? { ...g, enabled: !g.enabled } : g,
      ),
    })),

  toggleAll: (enabled) =>
    set((state) => ({
      fixGroups: state.fixGroups.map((g) => ({ ...g, enabled })),
    })),

  setExecuting: (v) => set({ isExecuting: v }),

  setProgress: (n) => set({ executionProgress: Math.min(100, Math.max(0, n)) }),

  reset: () => set(initialState),
}));
