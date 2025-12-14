import { NextResponse } from 'next/server';
import type { BattleSetup, BattleResult } from '@/types';
import { runSimulation } from '@/engine/simulation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { battleSetup } = body;

    // Validate request
    if (!battleSetup) {
      return NextResponse.json(
        { error: 'Missing battleSetup in request body' },
        { status: 400 }
      );
    }

    // Validate battle setup structure
    if (
      !battleSetup.attackingTroops ||
      !battleSetup.defendingTroops ||
      !battleSetup.attackerStrategy ||
      !battleSetup.defenderStrategy ||
      !battleSetup.attackingTerritory ||
      !battleSetup.defendingTerritory
    ) {
      return NextResponse.json(
        { error: 'Invalid battleSetup: missing required fields' },
        { status: 400 }
      );
    }

    // Run the simulation
    const result: BattleResult = await runSimulation(battleSetup as BattleSetup);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Simulation error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { error: 'AI service not configured. Please set OPENAI_API_KEY.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during simulation' },
      { status: 500 }
    );
  }
}

