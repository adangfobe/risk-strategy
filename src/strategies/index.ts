import type { Strategy, StrategyKnowledgeEntry } from '@/types/strategies';
import { frontalAssault } from './offensive/frontal-assault';
import { pincerAttack } from './offensive/pincer-attack';
import { scorchedEarth } from './offensive/scorched-earth';
import { nightRaid } from './offensive/night-raid';
import { shieldWall } from './defensive/shield-wall';
import { turtleFormation } from './defensive/turtle-formation';
import { fortifiedPosition } from './defensive/fortified-position';

export { frontalAssault, pincerAttack, scorchedEarth, nightRaid, shieldWall, turtleFormation, fortifiedPosition };

export const allStrategies: Strategy[] = [
  frontalAssault,
  pincerAttack,
  scorchedEarth,
  nightRaid,
  shieldWall,
  turtleFormation,
  fortifiedPosition,
];

/** Internal AI knowledge base — not user-selectable */
export const strategyKnowledgeBase: StrategyKnowledgeEntry[] = allStrategies.map((s) => ({
  id: s.id,
  name: s.name,
  type: s.type,
  description: s.description,
  tacticalDescription: s.tacticalDescription,
  historicalReference: s.historicalReference,
}));

export const getStrategyById = (id: string): Strategy | undefined =>
  allStrategies.find((strategy) => strategy.id === id);
