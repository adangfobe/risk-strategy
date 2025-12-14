import type { Strategy } from '@/types/strategies';

export const pincerAttack: Strategy = {
  id: 'pincer-attack',
  name: 'Pincer Attack',
  type: 'offensive',
  description: 'Split your forces and strike from two directions simultaneously.',
  
  tacticalDescription: `
    The attacking force divides into two columns, approaching through 
    separate routes to converge on the defender's position. This creates 
    confusion and prevents organized retreat, but requires coordination 
    and sufficient troop numbers to maintain two effective fighting forces.
  `,
  historicalReference: 'Battle of Cannae (216 BC) - Hannibal\'s double envelopment',
  
  baseEffectiveness: 70,
  riskFactor: 0.6,                  // Moderate variance
  troopRequirement: 4,              // Need enough to split
  
  strongAgainst: ['shield-wall'],
  weakAgainst: ['night-raid'],
  
  animationKey: 'pincer',
  iconPath: '/assets/strategy-icons/pincer.svg',
};

