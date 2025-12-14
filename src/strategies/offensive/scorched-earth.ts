import type { Strategy } from '@/types/strategies';

export const scorchedEarth: Strategy = {
  id: 'scorched-earth',
  name: 'Scorched Earth',
  type: 'offensive',
  description: 'Burn terrain to funnel enemy, then strike',
  
  tacticalDescription: `
    The attacker systematically destroys resources and terrain to force 
    the defender into a disadvantageous position. By controlling the 
    battlefield through environmental manipulation, the attacker can funnel 
    the enemy into a kill zone. Highly effective against static defensive 
    positions, but requires time and can backfire if the defender adapts quickly.
  `,
  historicalReference: 'Russian strategy against Napoleon (1812)',
  
  baseEffectiveness: 75,
  riskFactor: 0.7,                  // Higher variance - environmental factors
  troopRequirement: 3,              // Need enough to control terrain
  
  strongAgainst: ['turtle-formation'],
  weakAgainst: ['fortified-position'],
  
  animationKey: 'scorched',
  iconPath: '/assets/strategy-icons/scorched.svg',
};

