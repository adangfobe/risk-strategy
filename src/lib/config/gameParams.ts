export const GAME_CONFIG = {
  // Battle limits
  MIN_TROOPS_TO_ATTACK: 2,          // Must leave 1 behind
  MAX_TROOPS_IN_BATTLE: 50,         // Performance/balance cap
  
  // Simulation settings
  SIMULATION_SPEED: {
    FAST: 3000,       // ms total battle time
    NORMAL: 8000,
    CINEMATIC: 15000,
  },
  
  // AI settings
  AI_MODEL: 'claude-sonnet-4-20250514',
  AI_TEMPERATURE: 0.7,              // Some variance in narratives
  AI_MAX_TOKENS: 1024,
  
  // Display settings
  MAX_VISIBLE_UNITS: 50,
  CANVAS_TARGET_FPS: 60,
  
  // Balance tuning
  TROOP_RATIO_WEIGHT: 0.6,          // How much raw numbers matter
  STRATEGY_MATCHUP_WEIGHT: 0.4,     // How much tactics matter
  
  // Territory count (standard Risk)
  TOTAL_TERRITORIES: 42,
} as const;

