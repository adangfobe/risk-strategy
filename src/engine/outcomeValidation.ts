import type { BattleSetup } from '@/types';
import { STRATEGY_BALANCE } from '@/lib/config/strategyBalance';
import type { ResolvedBattleMetrics } from '@/engine/battleResolver';

export interface OutcomeProposal {
  winner: 'attacker' | 'defender';
  attackerCasualties: number;
  defenderCasualties: number;
}

export type OutcomeSource = 'ai' | 'baseline' | 'adjusted';

export interface FinalBattleOutcome extends ResolvedBattleMetrics {
  /** Whether the final numbers came from AI, baseline formula, or server adjustment. */
  outcomeSource: OutcomeSource;
}

/** If power gap exceeds this, the baseline favorite wins (AI upsets rejected). */
const UPSET_POWER_GAP_LIMIT = STRATEGY_BALANCE.MAX_UPSET_PROBABILITY;

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function computePowerGap(baseline: ResolvedBattleMetrics): number {
  const total = baseline.attackerPower + baseline.defenderPower;
  if (total <= 0) return 0;
  return Math.abs(baseline.attackerPower - baseline.defenderPower) / total;
}

function applyRiskRules(
  setup: BattleSetup,
  winner: 'attacker' | 'defender',
  attackerCasualties: number,
  defenderCasualties: number
): { attackerCasualties: number; defenderCasualties: number } {
  let atkCas = clampInt(attackerCasualties, 0, setup.attackingTroops);
  let defCas = clampInt(defenderCasualties, 0, setup.defendingTroops);

  if (winner === 'attacker') {
    atkCas = Math.min(atkCas, Math.max(0, setup.attackingTroops - 1));
    defCas = Math.min(defCas, setup.defendingTroops);
  } else {
    defCas = Math.min(defCas, Math.max(0, setup.defendingTroops - 1));
    atkCas = Math.min(atkCas, setup.attackingTroops);
  }

  return { attackerCasualties: atkCas, defenderCasualties: defCas };
}

function winnerLostTooMany(
  winner: 'attacker' | 'defender',
  setup: BattleSetup,
  attackerCasualties: number,
  defenderCasualties: number
): boolean {
  if (winner === 'attacker') {
    return attackerCasualties > defenderCasualties + Math.ceil(setup.attackingTroops * 0.25);
  }
  return defenderCasualties > attackerCasualties + Math.ceil(setup.defendingTroops * 0.25);
}

/**
 * Accept the AI's proposed winner and casualties when valid.
 * Fall back or adjust using the deterministic baseline when impossible or implausible.
 */
export function validateAndMergeOutcome(
  setup: BattleSetup,
  proposal: OutcomeProposal,
  baseline: ResolvedBattleMetrics
): FinalBattleOutcome {
  let winner: 'attacker' | 'defender' =
    proposal.winner === 'defender' ? 'defender' : 'attacker';
  let { attackerCasualties, defenderCasualties } = applyRiskRules(
    setup,
    winner,
    proposal.attackerCasualties,
    proposal.defenderCasualties
  );
  let outcomeSource: OutcomeSource = 'ai';
  const gap = computePowerGap(baseline);

  // Reject upsets when baseline favorite is strong (power gap > ~75%)
  if (winner !== baseline.winner && gap > UPSET_POWER_GAP_LIMIT) {
    winner = baseline.winner;
    attackerCasualties = baseline.attackerCasualties;
    defenderCasualties = baseline.defenderCasualties;
    outcomeSource = 'baseline';
  } else if (winner !== baseline.winner) {
    // Close fight — allow AI upset but keep casualties plausible
    if (winnerLostTooMany(winner, setup, attackerCasualties, defenderCasualties)) {
      attackerCasualties = Math.round(
        (attackerCasualties + baseline.attackerCasualties) / 2
      );
      defenderCasualties = Math.round(
        (defenderCasualties + baseline.defenderCasualties) / 2
      );
      outcomeSource = 'adjusted';
    }
  } else if (winnerLostTooMany(winner, setup, attackerCasualties, defenderCasualties)) {
    // Same winner as baseline but casualties don't match outcome
    attackerCasualties = baseline.attackerCasualties;
    defenderCasualties = baseline.defenderCasualties;
    outcomeSource = 'adjusted';
  }

  // Final clamp after any blending
  ({ attackerCasualties, defenderCasualties } = applyRiskRules(
    setup,
    winner,
    attackerCasualties,
    defenderCasualties
  ));

  // Zero casualties on both sides is impossible in battle
  if (attackerCasualties === 0 && defenderCasualties === 0) {
    attackerCasualties = baseline.attackerCasualties;
    defenderCasualties = baseline.defenderCasualties;
    outcomeSource = 'adjusted';
    ({ attackerCasualties, defenderCasualties } = applyRiskRules(
      setup,
      winner,
      attackerCasualties,
      defenderCasualties
    ));
  }

  return {
    ...baseline,
    winner,
    attackerCasualties,
    defenderCasualties,
    outcomeSource,
  };
}
