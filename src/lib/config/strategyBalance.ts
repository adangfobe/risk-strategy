export const STRATEGY_BALANCE = {
  // Advantage multipliers when one strategy counters another
  STRONG_MATCHUP_BONUS: 1.3,
  WEAK_MATCHUP_PENALTY: 0.7,
  NEUTRAL_MATCHUP: 1.0,
  
  // Minimum casualty rates (even winners lose troops)
  MIN_WINNER_CASUALTY_RATE: 0.1,
  MIN_LOSER_CASUALTY_RATE: 0.5,
  
  // Variance bounds
  MAX_UPSET_PROBABILITY: 0.25,      // Underdog can still win
} as const;

