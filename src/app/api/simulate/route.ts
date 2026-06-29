import { NextResponse } from 'next/server';
import type { BattleSetup, BattleResult } from '@/types';
import { runSimulation } from '@/engine/simulation';
import { hashBattleSetup } from '@/engine/battleResolver';
import { areAdjacent, getTerritory } from '@/lib/map/territories';

function validateBattleSetup(setup: BattleSetup): string | null {
  if (!setup.attackingTerritory?.id || !setup.defendingTerritory?.id) {
    return 'Both territories must be selected';
  }
  if (!areAdjacent(setup.attackingTerritory.id, setup.defendingTerritory.id)) {
    return 'Territories must be adjacent';
  }
  if (!setup.attackingTroops || setup.attackingTroops < 1) {
    return 'Attacker must have at least 1 troop';
  }
  if (!setup.defendingTroops || setup.defendingTroops < 1) {
    return 'Defender must have at least 1 troop';
  }
  if (!setup.attackerStrategyText?.trim()) {
    return 'Attacker strategy is required';
  }
  if (!setup.defenderStrategyText?.trim()) {
    return 'Defender strategy is required';
  }

  const from = getTerritory(setup.attackingTerritory.id);
  const to = getTerritory(setup.defendingTerritory.id);
  if (!from || !to) {
    return 'Invalid territory selection';
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { battleSetup } = body;

    if (!battleSetup) {
      return NextResponse.json(
        { error: 'Missing battleSetup in request body' },
        { status: 400 }
      );
    }

    const validationError = validateBattleSetup(battleSetup as BattleSetup);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const setupKey = hashBattleSetup(battleSetup as BattleSetup);
    const startedAt = Date.now();
    console.info(`[simulate] start key=${setupKey}`);

    const result: BattleResult = await runSimulation(battleSetup as BattleSetup);

    console.info(
      `[simulate] done key=${setupKey} winner=${result.winner} ` +
        `attacker=${result.attackerRemainingTroops}/${result.attackerStartingTroops} ` +
        `defender=${result.defenderRemainingTroops}/${result.defenderStartingTroops} ` +
        `ms=${Date.now() - startedAt}`
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Simulation error:', error);

    if (error instanceof Error) {
      if (error.message.includes('GEMINI_API_KEY')) {
        return NextResponse.json(
          { error: 'AI service not configured. Please set GEMINI_API_KEY.' },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during simulation' },
      { status: 500 }
    );
  }
}
