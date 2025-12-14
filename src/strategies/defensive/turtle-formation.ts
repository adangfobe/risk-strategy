import type { Strategy } from '@/types/strategies';

export const turtleFormation: Strategy = {
  id: 'turtle-formation',
  name: 'Turtle Formation',
  type: 'defensive',
  description: 'Roman testudo, maximum protection',
  
  tacticalDescription: `
    A defensive formation where troops arrange themselves in a compact, 
    overlapping pattern with shields covering all angles. This provides 
    exceptional protection against ranged attacks and environmental hazards, 
    but sacrifices mobility and offensive capability. Most effective when 
    holding a position against overwhelming odds.
  `,
  historicalReference: 'Roman testudo formation - Ancient Roman legions',
  
  baseEffectiveness: 75,
  riskFactor: 0.3,                  // Very low variance - defensive
  troopRequirement: 2,              // Can work with minimal troops
  
  strongAgainst: ['night-raid'],
  weakAgainst: ['scorched-earth'],
  
  animationKey: 'turtle',
  iconPath: '/assets/strategy-icons/turtle.svg',
};

