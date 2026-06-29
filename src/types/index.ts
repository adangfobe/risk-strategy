import type { MapTerritory } from '@/lib/map/territories';

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
export type TerrainType = 'plains' | 'mountain' | 'forest' | 'desert' | 'coast' | 'urban';

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

export function mapTerritoryToTerritory(t: MapTerritory): Territory {
  return {
    id: t.id,
    name: t.name,
    continent: t.continent,
    terrain: t.terrain,
  };
}

export type { Strategy, StrategyKnowledgeEntry } from './strategies';
