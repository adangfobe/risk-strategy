import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { hashBattleSetup } from '@/engine/battleResolver';
import type { BattleSetup, BattleResult, Player, SavedBattle } from '@/types';

interface BattleState {
  activeGameId: string | null;
  players: Player[];
  battleHistory: SavedBattle[];

  battleSetup: BattleSetup | null;
  battleResult: BattleResult | null;
  battleAttackerPlayerId: string | null;
  battleDefenderPlayerId: string | null;
  isSimulating: boolean;
  simulationError: string | null;
  /** Setup hash for an in-flight simulation — prevents duplicate API calls across remounts. */
  simulationKeyInFlight: string | null;

  setActiveGame: (gameId: string, players: Player[], battles: SavedBattle[]) => void;
  setPlayers: (players: Player[]) => void;
  setBattleSetup: (
    setup: BattleSetup,
    attackerPlayerId?: string | null,
    defenderPlayerId?: string | null
  ) => void;
  setBattleResult: (result: BattleResult) => void;
  setSimulating: (isSimulating: boolean) => void;
  setSimulationError: (error: string | null) => void;
  setSimulationKeyInFlight: (key: string | null) => void;
  addBattleToHistory: (battle: SavedBattle) => void;
  loadSavedBattle: (battle: SavedBattle) => void;
  resetBattle: () => void;
  leaveGame: () => void;
}

const initialBattle = {
  battleSetup: null,
  battleResult: null,
  battleAttackerPlayerId: null,
  battleDefenderPlayerId: null,
  isSimulating: false,
  simulationError: null,
  simulationKeyInFlight: null,
};

export const useBattleStore = create<BattleState>()(
  persist(
    (set) => ({
      activeGameId: null,
      players: [],
      battleHistory: [],
      ...initialBattle,

      setActiveGame: (gameId, players, battles) => {
        set({
          activeGameId: gameId,
          players,
          battleHistory: battles,
          ...initialBattle,
        });
      },

      setPlayers: (players) => {
        set({ players });
      },

      setBattleSetup: (setup, attackerPlayerId = null, defenderPlayerId = null) => {
        const key = hashBattleSetup(setup);
        set({
          battleSetup: setup,
          battleResult: null,
          battleAttackerPlayerId: attackerPlayerId,
          battleDefenderPlayerId: defenderPlayerId,
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

      leaveGame: () => {
        set({
          activeGameId: null,
          players: [],
          battleHistory: [],
          ...initialBattle,
        });
      },
    }),
    {
      name: 'risk-session',
      partialize: (state) => ({
        activeGameId: state.activeGameId,
        players: state.players,
        battleHistory: state.battleHistory,
        battleSetup: state.battleSetup,
        battleResult: state.battleResult,
      }),
    }
  )
);
