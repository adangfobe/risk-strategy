import { create } from 'zustand';
import type { BattleSetup, BattleResult, Strategy, PlayerColor } from '@/types';

interface BattleState {
  // Current battle setup
  battleSetup: BattleSetup | null;
  
  // Battle result
  battleResult: BattleResult | null;
  
  // Loading states
  isSimulating: boolean;
  simulationError: string | null;
  
  // Actions
  setBattleSetup: (setup: BattleSetup) => void;
  setBattleResult: (result: BattleResult) => void;
  setSimulating: (isSimulating: boolean) => void;
  setSimulationError: (error: string | null) => void;
  resetBattle: () => void;
  
  // Helper getters
  getAttackerStrategy: () => Strategy | null;
  getDefenderStrategy: () => Strategy | null;
}

const initialState = {
  battleSetup: null,
  battleResult: null,
  isSimulating: false,
  simulationError: null,
};

export const useBattleStore = create<BattleState>((set, get) => ({
  ...initialState,
  
  setBattleSetup: (setup: BattleSetup) => {
    set({ 
      battleSetup: setup,
      battleResult: null,
      simulationError: null,
    });
  },
  
  setBattleResult: (result: BattleResult) => {
    set({ 
      battleResult: result,
      isSimulating: false,
      simulationError: null,
    });
  },
  
  setSimulating: (isSimulating: boolean) => {
    set({ 
      isSimulating,
      simulationError: null,
    });
  },
  
  setSimulationError: (error: string | null) => {
    set({ 
      simulationError: error,
      isSimulating: false,
    });
  },
  
  resetBattle: () => {
    set(initialState);
  },
  
  getAttackerStrategy: () => {
    return get().battleSetup?.attackerStrategy || null;
  },
  
  getDefenderStrategy: () => {
    return get().battleSetup?.defenderStrategy || null;
  },
}));

