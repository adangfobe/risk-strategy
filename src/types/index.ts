import type { MapTerritory } from '@/lib/map/territories';

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
export type TerrainType = 'plains' | 'mountain' | 'forest' | 'desert' | 'coast' | 'urban';

/** Hex values used to render player/team colors on the map and battle visualizer. */
export const PLAYER_COLOR_HEX: Record<PlayerColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
};

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
}

export interface Territory {
  id: string;
  name: string;
  continent: string;
  terrain?: TerrainType;
}

export interface BattlePhase {
  phase: number;
  title: string;
  description: string;
  momentumShift: 'attacker' | 'defender' | 'none';
  animationCue: string;
}

export interface BattleSetup {
  attackingTerritory: Territory;
  defendingTerritory: Territory;
  attackingTroops: number;
  defendingTroops: number;
  attackerStrategyText: string;
  defenderStrategyText: string;
  attackerColor: PlayerColor;
  defenderColor: PlayerColor;
  attackerName?: string;
  defenderName?: string;
}

export interface BattleResult {
  winner: 'attacker' | 'defender';
  attackerStartingTroops: number;
  defenderStartingTroops: number;
  attackerRemainingTroops: number;
  defenderRemainingTroops: number;
  territoryConquered: boolean;

  battleNarrative: string;
  phases: BattlePhase[];
  keyMoment: string;
  attackerStrategyAssessment: string;
  defenderStrategyAssessment: string;

  simulationSeed: string;
}

export interface SavedBattle {
  id: string;
  timestamp: number;
  setup: BattleSetup;
  result: BattleResult;
  attackerPlayerId: string | null;
  defenderPlayerId: string | null;
}

export function mapTerritoryToTerritory(t: MapTerritory): Territory {
  return {
    id: t.id,
    name: t.name,
    continent: t.continent,
    terrain: t.terrain,
  };
}

export type { Strategy, StrategyKnowledgeEntry } from './strategies';
