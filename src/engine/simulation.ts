import type { BattleSetup, BattleResult } from '@/types';
import { simulateBattle } from './ai-client';

/**
 * Orchestrates the battle simulation process
 */
export async function runSimulation(battleSetup: BattleSetup): Promise<BattleResult> {
  // Validate battle setup
  if (battleSetup.attackingTroops < 1 || battleSetup.defendingTroops < 1) {
    throw new Error('Both sides must have at least 1 troop');
  }

  // Run the AI simulation
  const result = await simulateBattle(battleSetup);
  
  if (!result) {
    throw new Error('Failed to simulate battle');
  }

  // Ensure results are valid
  if (result.attackerRemainingTroops < 0 || result.defenderRemainingTroops < 0) {
    throw new Error('Invalid battle result: negative remaining troops');
  }

  // Ensure at least one side is eliminated if defender loses
  if (result.winner === 'attacker' && result.defenderRemainingTroops > 0) {
    result.defenderRemainingTroops = 0;
  }

  // Ensure attacker is eliminated if defender wins
  if (result.winner === 'defender' && result.attackerRemainingTroops > 0) {
    result.attackerRemainingTroops = 0;
  }

  return result;
}

