export type StrategyType = 'offensive' | 'defensive';

/** Internal AI knowledge base entry — not user-selectable */
export interface StrategyKnowledgeEntry {
  id: string;
  name: string;
  type: StrategyType;
  description: string;
  tacticalDescription: string;
  historicalReference?: string;
  counters?: string;
}

/** @deprecated Use StrategyKnowledgeEntry — kept for strategy file compatibility */
export interface Strategy extends StrategyKnowledgeEntry {
  baseEffectiveness: number;
  riskFactor: number;
  troopRequirement: number;
  strongAgainst: string[];
  weakAgainst: string[];
  animationKey: string;
  iconPath: string;
}
