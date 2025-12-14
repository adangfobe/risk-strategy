// Strategy registry - exports all strategies

// Offensive strategies
export { frontalAssault } from './offensive/frontal-assault';
export { pincerAttack } from './offensive/pincer-attack';
export { scorchedEarth } from './offensive/scorched-earth';
export { nightRaid } from './offensive/night-raid';

// Defensive strategies
export { shieldWall } from './defensive/shield-wall';
export { turtleFormation } from './defensive/turtle-formation';
export { fortifiedPosition } from './defensive/fortified-position';

import type { Strategy } from '@/types/strategies';
import { frontalAssault } from './offensive/frontal-assault';
import { pincerAttack } from './offensive/pincer-attack';
import { scorchedEarth } from './offensive/scorched-earth';
import { nightRaid } from './offensive/night-raid';
import { shieldWall } from './defensive/shield-wall';
import { turtleFormation } from './defensive/turtle-formation';
import { fortifiedPosition } from './defensive/fortified-position';

// All strategies array
export const allStrategies: Strategy[] = [
  frontalAssault,
  pincerAttack,
  scorchedEarth,
  nightRaid,
  shieldWall,
  turtleFormation,
  fortifiedPosition,
];

// Strategy lookup by ID
export const getStrategyById = (id: string): Strategy | undefined => {
  return allStrategies.find(strategy => strategy.id === id);
};

// Get strategies by type
export const getStrategiesByType = (type: 'offensive' | 'defensive'): Strategy[] => {
  return allStrategies.filter(strategy => strategy.type === type);
};

// Get offensive strategies
export const getOffensiveStrategies = (): Strategy[] => {
  return getStrategiesByType('offensive');
};

// Get defensive strategies
export const getDefensiveStrategies = (): Strategy[] => {
  return getStrategiesByType('defensive');
};

