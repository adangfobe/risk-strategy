import type { Strategy } from '@/types/strategies';

export const nightRaid: Strategy = {
  id: 'night-raid',
  name: 'Night Raid',
  type: 'offensive',
  description: 'Pre-dawn surprise attack',
  
  tacticalDescription: `
    A stealthy assault launched under cover of darkness, targeting the 
    defender's weakest moments. The element of surprise and confusion 
    can overcome numerical disadvantages, but requires skilled troops 
    and favorable conditions. Most effective when the defender is unprepared 
    or in a vulnerable position.
  `,
  historicalReference: 'Battle of Trenton (1776) - Washington\'s crossing',
  
  baseEffectiveness: 80,
  riskFactor: 0.8,                  // High variance - surprise factor
  troopRequirement: 2,              // Can work with fewer troops
  
  strongAgainst: ['fortified-position'],
  weakAgainst: ['turtle-formation'],
  
  animationKey: 'night-raid',
  iconPath: '/assets/strategy-icons/night-raid.svg',
};

