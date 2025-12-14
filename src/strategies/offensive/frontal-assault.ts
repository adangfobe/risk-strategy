import type { Strategy } from '@/types/strategies';

export const frontalAssault: Strategy = {
  id: 'frontal-assault',
  name: 'Frontal Assault',
  type: 'offensive',
  description: 'Direct charge, overwhelming force',
  
  tacticalDescription: `
    A straightforward, head-on attack that relies on superior numbers and 
    momentum to overwhelm the defender. The attacking force charges directly 
    at the enemy position, using brute force and determination to break 
    through defensive lines. Effective when you have numerical superiority, 
    but vulnerable to well-prepared defensive formations.
  `,
  historicalReference: 'Battle of Gettysburg (1863) - Pickett\'s Charge',
  
  baseEffectiveness: 65,
  riskFactor: 0.5,                  // Lower variance - straightforward
  troopRequirement: 2,              // Can be used with minimal troops
  
  strongAgainst: ['fortified-position'],
  weakAgainst: ['shield-wall'],
  
  animationKey: 'frontal',
  iconPath: '/assets/strategy-icons/frontal.svg',
};

