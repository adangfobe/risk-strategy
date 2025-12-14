export type StrategyType = 'offensive' | 'defensive';

export interface Strategy {
  id: string;
  name: string;
  type: StrategyType;
  description: string;
  
  // Flavor and context for AI simulation
  tacticalDescription: string;
  historicalReference?: string;
  
  // Balance parameters
  baseEffectiveness: number;        // 0-100 baseline strength
  riskFactor: number;               // Higher = more variance in outcomes
  troopRequirement: number;         // Minimum troops to use this strategy
  
  // Matchup modifiers (how this performs against specific counters)
  strongAgainst: string[];          // Strategy IDs this beats
  weakAgainst: string[];            // Strategy IDs this loses to
  
  // Visual/simulation hooks
  animationKey: string;
  iconPath: string;
}

export interface StrategyMatchup {
  attackerStrategy: string;
  defenderStrategy: string;
  attackerModifier: number;         // Multiplier: 0.5 - 1.5
  defenderModifier: number;
  narrativeHint: string;            // Context for AI narration
}

