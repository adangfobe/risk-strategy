import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { hashBattleSetup } from '@/engine/battleResolver';
import type { BattleSetup, BattleResult, Player, SavedBattle } from '@/types';

interface BattleState {
  players: Player[];
  battleHistory: SavedBattle[];

  battleSetup: BattleSetup | null;
  battleResult: BattleResult | null;
  isSimulating: boolean;
  simulationError: string | null;
  /** Setup hash for an in-flight simulation — prevents duplicate API calls across remounts. */
  simulationKeyInFlight: string | null;

  setPlayers: (players: Player[]) => void;
  setBattleSetup: (setup: BattleSetup) => void;
  setBattleResult: (result: BattleResult) => void;
  setSimulating: (isSimulating: boolean) => void;
  setSimulationError: (error: string | null) => void;
  setSimulationKeyInFlight: (key: string | null) => void;
  addBattleToHistory: (battle: SavedBattle) => void;
  loadSavedBattle: (battle: SavedBattle) => void;
  resetBattle: () => void;
  newGame: () => void;
}

const initialBattle = {
  battleSetup: null,
  battleResult: null,
  isSimulating: false,
  simulationError: null,
  simulationKeyInFlight: null,
};

export const useBattleStore = create<BattleState>()(
  persist(
    (set) => ({
      players: [],
      battleHistory: [],
      ...initialBattle,

      setPlayers: (players) => {
        set({ players });
      },

      setBattleSetup: (setup) => {
        const key = hashBattleSetup(setup);
        set({
          battleSetup: setup,
          battleResult: null,
          simulationError: null,
          isSimulating: true,
          simulationKeyInFlight: key,
        });
      },

      setBattleResult: (result) => {
        set({
          battleResult: result,
          isSimulating: false,
          simulationError: null,
          simulationKeyInFlight: null,
        });
      },

      setSimulating: (isSimulating) => {
        set({ isSimulating, simulationError: null });
      },

      setSimulationError: (error) => {
        set({ simulationError: error, isSimulating: false, simulationKeyInFlight: null });
      },

      setSimulationKeyInFlight: (key) => {
        set({ simulationKeyInFlight: key });
      },

      addBattleToHistory: (battle) => {
        set((state) => ({
          battleHistory: [battle, ...state.battleHistory],
        }));
      },

      loadSavedBattle: (battle) => {
        set({
          battleSetup: battle.setup,
          battleResult: battle.result,
          isSimulating: false,
          simulationError: null,
          simulationKeyInFlight: null,
        });
      },

      resetBattle: () => {
        set({ ...initialBattle });
      },

      newGame: () => {
        set({ players: [], battleHistory: [], ...initialBattle });
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'risk-session',
            JSON.stringify({
              state: {
                players: [],
                battleHistory: [],
                battleSetup: null,
                battleResult: null,
              },
              version: 0,
            })
          );
        }
      },
    }),
    {
      name: 'risk-session',
      partialize: (state) => ({
        players: state.players,
        battleHistory: state.battleHistory,
        battleSetup: state.battleSetup,
        battleResult: state.battleResult,
      }),
    }
  )
);
