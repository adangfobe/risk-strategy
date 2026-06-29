import type { BattleSetup, BattleResult } from '@/types';
import { areAdjacent } from '@/lib/map/territories';
import { simulateBattle } from './ai-client';

export async function runSimulation(battleSetup: BattleSetup): Promise<BattleResult> {
  if (battleSetup.attackingTroops < 1 || battleSetup.defendingTroops < 1) {
    throw new Error('Both sides must have at least 1 troop');
  }

  if (!areAdjacent(battleSetup.attackingTerritory.id, battleSetup.defendingTerritory.id)) {
    throw new Error('Territories must be adjacent to battle');
  }

  const result = await simulateBattle(battleSetup);

  if (!result) {
    throw new Error('Failed to simulate battle');
  }

  if (result.attackerRemainingTroops < 0 || result.defenderRemainingTroops < 0) {
    throw new Error('Invalid battle result: negative remaining troops');
  }

  // Risk: conquering a territory eliminates the defender's remaining garrison.
  if (result.winner === 'attacker' && result.territoryConquered) {
    result.defenderRemainingTroops = 0;
  }

  return result;
}
