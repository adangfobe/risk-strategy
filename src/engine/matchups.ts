import type { Strategy, StrategyMatchup } from '@/types/strategies';
import { STRATEGY_BALANCE } from '@/lib/config/strategyBalance';

/**
 * Calculates the matchup modifiers between an attacker and defender strategy.
 * Returns modifiers that can be applied to effectiveness calculations.
 */
export function calculateMatchup(
  attackerStrategy: Strategy,
  defenderStrategy: Strategy
): StrategyMatchup {
  const attackerId = attackerStrategy.id;
  const defenderId = defenderStrategy.id;
  
  // Check if attacker is strong against defender
  const attackerIsStrong = attackerStrategy.strongAgainst.includes(defenderId);
  
  // Check if attacker is weak against defender
  const attackerIsWeak = attackerStrategy.weakAgainst.includes(defenderId);
  
  // Check if defender is strong against attacker (reverse lookup)
  const defenderIsStrong = defenderStrategy.strongAgainst.includes(attackerId);
  
  // Check if defender is weak against attacker (reverse lookup)
  const defenderIsWeak = defenderStrategy.weakAgainst.includes(attackerId);
  
  // Calculate modifiers
  let attackerModifier: number = STRATEGY_BALANCE.NEUTRAL_MATCHUP;
  let defenderModifier: number = STRATEGY_BALANCE.NEUTRAL_MATCHUP;
  let narrativeHint = 'The strategies are evenly matched.';
  
  if (attackerIsStrong || defenderIsWeak) {
    attackerModifier = STRATEGY_BALANCE.STRONG_MATCHUP_BONUS;
    defenderModifier = STRATEGY_BALANCE.WEAK_MATCHUP_PENALTY;
    narrativeHint = `${attackerStrategy.name} has a tactical advantage over ${defenderStrategy.name}.`;
  } else if (attackerIsWeak || defenderIsStrong) {
    attackerModifier = STRATEGY_BALANCE.WEAK_MATCHUP_PENALTY;
    defenderModifier = STRATEGY_BALANCE.STRONG_MATCHUP_BONUS;
    narrativeHint = `${defenderStrategy.name} counters ${attackerStrategy.name} effectively.`;
  }
  
  return {
    attackerStrategy: attackerId,
    defenderStrategy: defenderId,
    attackerModifier,
    defenderModifier,
    narrativeHint,
  };
}

/**
 * Determines which side has the matchup advantage
 */
export function getMatchupAdvantage(
  attackerStrategy: Strategy,
  defenderStrategy: Strategy
): 'attacker' | 'defender' | 'neutral' {
  const matchup = calculateMatchup(attackerStrategy, defenderStrategy);
  
  if (matchup.attackerModifier > STRATEGY_BALANCE.NEUTRAL_MATCHUP) {
    return 'attacker';
  } else if (matchup.defenderModifier > STRATEGY_BALANCE.NEUTRAL_MATCHUP) {
    return 'defender';
  }
  return 'neutral';
}

/**
 * Calculates the strength of the matchup advantage (0-1 scale)
 */
export function getMatchupAdvantageStrength(
  attackerStrategy: Strategy,
  defenderStrategy: Strategy
): number {
  const matchup = calculateMatchup(attackerStrategy, defenderStrategy);
  
  if (matchup.attackerModifier > STRATEGY_BALANCE.NEUTRAL_MATCHUP) {
    return (matchup.attackerModifier - STRATEGY_BALANCE.NEUTRAL_MATCHUP) / 
           (STRATEGY_BALANCE.STRONG_MATCHUP_BONUS - STRATEGY_BALANCE.NEUTRAL_MATCHUP);
  } else if (matchup.defenderModifier > STRATEGY_BALANCE.NEUTRAL_MATCHUP) {
    return (matchup.defenderModifier - STRATEGY_BALANCE.NEUTRAL_MATCHUP) / 
           (STRATEGY_BALANCE.STRONG_MATCHUP_BONUS - STRATEGY_BALANCE.NEUTRAL_MATCHUP);
  }
  return 0;
}

