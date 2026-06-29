import { create } from 'zustand';
import type { BattleSetup, BattleResult } from '@/types';

interface BattleState {
  battleSetup: BattleSetup | null;
  battleResult: BattleResult | null;
  isSimulating: boolean;
  simulationError: string | null;

  setBattleSetup: (setup: BattleSetup) => void;
  setBattleResult: (result: BattleResult) => void;
  setSimulating: (isSimulating: boolean) => void;
  setSimulationError: (error: string | null) => void;
  resetBattle: () => void;
}

const initialState = {
  battleSetup: null,
  battleResult: null,
  isSimulating: false,
  simulationError: null,
};

export const useBattleStore = create<BattleState>((set) => ({
  ...initialState,

  setBattleSetup: (setup) => {
    set({
      battleSetup: setup,
      battleResult: null,
      simulationError: null,
    });
  },

  setBattleResult: (result) => {
    set({
      battleResult: result,
      isSimulating: false,
      simulationError: null,
    });
  },

  setSimulating: (isSimulating) => {
    set({ isSimulating, simulationError: null });
  },

  setSimulationError: (error) => {
    set({ simulationError: error, isSimulating: false });
  },

  resetBattle: () => {
    set(initialState);
  },
}));
