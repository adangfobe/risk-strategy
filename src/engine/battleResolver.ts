import type { BattleSetup, TerrainType } from '@/types';
import { STRATEGY_BALANCE } from '@/lib/config/strategyBalance';

const ATTACK_TERRAIN_MULT: Record<TerrainType, number> = {
  plains: 1.08,
  coast: 1.05,
  desert: 1.0,
  forest: 0.95,
  urban: 0.9,
  mountain: 0.88,
};

const DEFENSE_TERRAIN_MULT: Record<TerrainType, number> = {
  mountain: 1.22,
  urban: 1.18,
  forest: 1.14,
  coast: 1.06,
  plains: 1.0,
  desert: 0.94,
};

/** Risk-style home-territory defense bonus. */
const DEFENDER_HOME_BONUS = 1.12;

export interface ResolvedBattleMetrics {
  attackerPower: number;
  defenderPower: number;
  winner: 'attacker' | 'defender';
  attackerCasualties: number;
  defenderCasualties: number;
  attackerStrategyScore: number;
  defenderStrategyScore: number;
  simulationSeed: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Deterministic hash from battle inputs — same setup always yields the same seed. */
export function hashBattleSetup(setup: BattleSetup): string {
  const key = [
    setup.attackingTerritory.id,
    setup.defendingTerritory.id,
    setup.attackingTroops,
    setup.defendingTroops,
    setup.attackerStrategyText.trim().toLowerCase(),
    setup.defenderStrategyText.trim().toLowerCase(),
  ].join('|');

  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Gemini requires seed as a signed int32 — constrain the hash to that range. */
export function battleSetupSeedInt32(setup: BattleSetup): number {
  const hash = parseInt(hashBattleSetup(setup), 16);
  const seed = hash % 2_147_483_647;
  return seed === 0 ? 1 : seed;
}

/** Map a 1–10 strategy score to a power multiplier (0.72 – 1.28). */
function strategyMultiplier(score: number): number {
  const s = clamp(score, 1, 10);
  return 0.72 + (s / 10) * 0.56;
}

/**
 * Deterministically resolve winner and casualties from troop counts, terrain,
 * and AI-assigned strategy scores. Same inputs always produce the same outcome.
 */
export function resolveBattle(
  setup: BattleSetup,
  attackerStrategyScore: number,
  defenderStrategyScore: number
): ResolvedBattleMetrics {
  const atkTerrain = setup.attackingTerritory.terrain ?? 'plains';
  const defTerrain = setup.defendingTerritory.terrain ?? 'plains';

  const atkScore = clamp(Math.round(attackerStrategyScore), 1, 10);
  const defScore = clamp(Math.round(defenderStrategyScore), 1, 10);

  const attackerPower =
    setup.attackingTroops *
    strategyMultiplier(atkScore) *
    (ATTACK_TERRAIN_MULT[atkTerrain] ?? 1);

  const defenderPower =
    setup.defendingTroops *
    strategyMultiplier(defScore) *
    (DEFENSE_TERRAIN_MULT[defTerrain] ?? 1) *
    DEFENDER_HOME_BONUS;

  const winner: 'attacker' | 'defender' =
    attackerPower >= defenderPower ? 'attacker' : 'defender';

  const totalPower = attackerPower + defenderPower;
  const powerGap = Math.abs(attackerPower - defenderPower) / totalPower;

  const winnerCasRate =
    STRATEGY_BALANCE.MIN_WINNER_CASUALTY_RATE + powerGap * 0.15;
  const loserCasRate =
    STRATEGY_BALANCE.MIN_LOSER_CASUALTY_RATE + powerGap * 0.35;

  let attackerCasualties: number;
  let defenderCasualties: number;

  if (winner === 'attacker') {
    attackerCasualties = Math.max(
      1,
      Math.round(setup.attackingTroops * winnerCasRate)
    );
    defenderCasualties = Math.min(
      setup.defendingTroops,
      Math.max(1, Math.round(setup.defendingTroops * loserCasRate))
    );
  } else {
    defenderCasualties = Math.max(
      1,
      Math.round(setup.defendingTroops * winnerCasRate)
    );
    attackerCasualties = Math.min(
      setup.attackingTroops,
      Math.max(1, Math.round(setup.attackingTroops * loserCasRate))
    );
  }

  // Attacker must keep at least 1 troop if they win (Risk rule).
  if (winner === 'attacker') {
    attackerCasualties = Math.min(
      attackerCasualties,
      setup.attackingTroops - 1
    );
  }

  return {
    attackerPower: Math.round(attackerPower * 100) / 100,
    defenderPower: Math.round(defenderPower * 100) / 100,
    winner,
    attackerCasualties,
    defenderCasualties,
    attackerStrategyScore: atkScore,
    defenderStrategyScore: defScore,
    simulationSeed: hashBattleSetup(setup),
  };
}

/** Human-readable resolved outcome for the narrative AI pass. */
export function formatResolvedOutcome(
  resolved: ResolvedBattleMetrics,
  setup: BattleSetup,
  attackerRemaining: number,
  defenderRemaining: number
): string {
  const attackerLabel = setup.attackerName ?? 'Attacker';
  const defenderLabel = setup.defenderName ?? 'Defender';
  const winnerLabel = resolved.winner === 'attacker' ? attackerLabel : defenderLabel;
  const atkLost = setup.attackingTroops - attackerRemaining;
  const defLost = setup.defendingTroops - defenderRemaining;

  return [
    'RESOLVED OUTCOME (fixed — narrative must match this exactly):',
    `Winner: ${winnerLabel} (${resolved.winner})`,
    `Attacker power: ${resolved.attackerPower} | Defender power: ${resolved.defenderPower}`,
    `${attackerLabel}: ${setup.attackingTroops} started → ${attackerRemaining} remaining (${atkLost} lost)`,
    `${defenderLabel}: ${setup.defendingTroops} started → ${defenderRemaining} remaining (${defLost} lost)`,
    `Territory conquered: ${resolved.winner === 'attacker' ? 'yes' : 'no'}`,
    `Battle: ${setup.attackingTerritory.name} → ${setup.defendingTerritory.name}`,
  ].join('\n');
}

/** Fixed terrain context for the AI prompt (deterministic, not AI-invented). */
export function getTerrainModifiers(setup: BattleSetup): string {
  const atk = setup.attackingTerritory.terrain ?? 'plains';
  const def = setup.defendingTerritory.terrain ?? 'plains';
  return [
    `Attacker launch terrain (${atk}): x${ATTACK_TERRAIN_MULT[atk] ?? 1}`,
    `Defender hold terrain (${def}): x${DEFENSE_TERRAIN_MULT[def] ?? 1}`,
    `Defender home bonus: x${DEFENDER_HOME_BONUS}`,
  ].join(' | ');
}
