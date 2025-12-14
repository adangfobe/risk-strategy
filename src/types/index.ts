import type { Strategy, StrategyMatchup } from './strategies';

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
export type TerrainType = 'plains' | 'mountain' | 'forest' | 'desert' | 'coast' | 'urban';

export interface Territory {
  id: string;
  name: string;
  continent: string;
  terrain?: TerrainType;          // Future: affects strategy effectiveness
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
  attackerStrategy: Strategy;
  defenderStrategy: Strategy;
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
  
  // AI-generated content
  battleNarrative: string;
  phases: BattlePhase[];
  keyMoment: string;              // Highlight for results screen
  
  // Metadata
  strategyMatchup: StrategyMatchup;
  simulationSeed: string;         // For replay/debugging
}

export interface SimulationPrompt {
  context: {
    attackingTroops: number;
    defendingTroops: number;
    attackerStrategy: Strategy;
    defenderStrategy: Strategy;
    matchupAdvantage: 'attacker' | 'defender' | 'neutral';
    advantageStrength: number;
  };
  
  instructions: string;  // How to evaluate and respond
  
  responseFormat: {
    winner: 'attacker' | 'defender';
    attackerCasualties: number;
    defenderCasualties: number;
    battlePhases: BattlePhase[];
    narrativeSummary: string;
  };
}

// Re-export strategy types for convenience
export type { Strategy, StrategyMatchup } from './strategies';

