import type { Strategy } from '@/types/strategies';

export const shieldWall: Strategy = {
  id: 'shield-wall',
  name: 'Shield Wall',
  type: 'defensive',
  description: 'Viking-style interlocked defense',
  
  tacticalDescription: `
    Troops form a tightly interlocked defensive line with overlapping shields, 
    creating an almost impenetrable barrier. This formation excels at repelling 
    direct frontal assaults through superior coordination and mutual support. 
    However, it is vulnerable to attacks from multiple directions that can 
    break the formation's cohesion.
  `,
  historicalReference: 'Battle of Stamford Bridge (1066) - Viking shield wall',
  
  baseEffectiveness: 70,
  riskFactor: 0.4,                  // Low variance - reliable defense
  troopRequirement: 3,              // Need enough for formation
  
  strongAgainst: ['frontal-assault'],
  weakAgainst: ['pincer-attack'],
  
  animationKey: 'shield-wall',
  iconPath: '/assets/strategy-icons/shield-wall.svg',
};

