import type { Strategy } from '@/types/strategies';

export const fortifiedPosition: Strategy = {
  id: 'fortified-position',
  name: 'Fortified Position',
  type: 'defensive',
  description: 'Dig in, use terrain advantage',
  
  tacticalDescription: `
    The defender prepares the battlefield by creating defensive works, 
    using terrain features, and establishing strong positions. This 
    strategy maximizes the defender's advantages through preparation 
    and positioning. Highly effective against direct assaults, but 
    vulnerable to strategies that can bypass or neutralize the 
    fortifications.
  `,
  historicalReference: 'Battle of Thermopylae (480 BC) - Spartan defense',
  
  baseEffectiveness: 80,
  riskFactor: 0.5,                  // Moderate variance
  troopRequirement: 2,              // Can work with minimal troops
  
  strongAgainst: ['pincer-attack'],
  weakAgainst: ['frontal-assault'],
  
  animationKey: 'fortified',
  iconPath: '/assets/strategy-icons/fortified.svg',
};

