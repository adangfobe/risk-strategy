'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBattleStore } from '@/store/battleStore';

function friendlyFetchError(err: unknown): string {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Could not reach the server. Make sure the dev server is running (npm run dev) and try again.';
  }
  return err instanceof Error ? err.message : 'Simulation failed';
}

export default function BattlePage() {
  const router = useRouter();
  const {
    battleSetup,
    battleResult,
    isSimulating,
    simulationError,
    setBattleResult,
    setSimulating,
    setSimulationError,
    resetBattle,
  } = useBattleStore();
  const hasAutoRun = useRef(false);

  const runSimulation = useCallback(async () => {
    if (!battleSetup) return;

    setSimulating(true);
    setSimulationError(null);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleSetup }),
      });

      let data: { error?: string; result?: typeof battleResult };
      try {
        data = await res.json();
      } catch {
        throw new TypeError('Failed to fetch');
      }

      if (!res.ok) throw new Error(data.error || 'Simulation failed');
      if (!data.result) throw new Error('Simulation returned no result');

      setBattleResult(data.result);
    } catch (err) {
      setSimulationError(friendlyFetchError(err));
    }
  }, [battleSetup, setBattleResult, setSimulating, setSimulationError]);

  useEffect(() => {
    if (!battleSetup) {
      router.push('/');
    }
  }, [battleSetup, router]);

  useEffect(() => {
    if (!battleSetup || battleResult || hasAutoRun.current) return;
    hasAutoRun.current = true;
    runSimulation();
  }, [battleSetup, battleResult, runSimulation]);

  if (!battleSetup) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-lg px-4 pb-8 pt-safe">
      <div className="mb-6">
        <button
          onClick={() => {
            resetBattle();
            router.push('/');
          }}
          className="mb-4 min-h-[44px] text-blue-600 hover:text-blue-800"
        >
          ← Back to Setup
        </button>
        <h1 className="text-2xl font-bold">Battle Simulation</h1>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow-md">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-green-700">Attacker</h2>
            <p className="text-gray-600">
              <strong>From:</strong> {battleSetup.attackingTerritory.name}
            </p>
            <p className="text-gray-600">
              <strong>Troops:</strong> {battleSetup.attackingTroops}
            </p>
            <p className="mt-2 text-sm text-gray-500 italic">
              &ldquo;{battleSetup.attackerStrategyText}&rdquo;
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-red-700">Defender</h2>
            <p className="text-gray-600">
              <strong>Territory:</strong> {battleSetup.defendingTerritory.name}
            </p>
            <p className="text-gray-600">
              <strong>Troops:</strong> {battleSetup.defendingTroops}
            </p>
            <p className="mt-2 text-sm text-gray-500 italic">
              &ldquo;{battleSetup.defenderStrategyText}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {isSimulating && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <p className="text-blue-800">Simulating battle…</p>
        </div>
      )}

      {simulationError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-800">{simulationError}</p>
          <button
            type="button"
            onClick={runSimulation}
            disabled={isSimulating}
            className="mt-4 min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Try Again
          </button>
        </div>
      )}

      {battleResult && (
        <div className="rounded-lg bg-white p-4 shadow-md">
          <h2 className="mb-4 text-xl font-bold">Battle Result</h2>
          <p className="mb-4 text-lg">
            <strong>Winner:</strong>{' '}
            {battleResult.winner === 'attacker' ? 'Attacker' : 'Defender'}
          </p>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-gray-600">
                <strong>Attacker Losses:</strong>{' '}
                {battleResult.attackerStartingTroops - battleResult.attackerRemainingTroops}
              </p>
              <p className="text-gray-600">
                <strong>Remaining:</strong> {battleResult.attackerRemainingTroops}
              </p>
            </div>
            <div>
              <p className="text-gray-600">
                <strong>Defender Losses:</strong>{' '}
                {battleResult.defenderStartingTroops - battleResult.defenderRemainingTroops}
              </p>
              <p className="text-gray-600">
                <strong>Remaining:</strong> {battleResult.defenderRemainingTroops}
              </p>
            </div>
          </div>

          {battleResult.keyMoment && (
            <div className="mb-4 rounded-lg bg-amber-50 p-4">
              <h3 className="mb-1 font-semibold">Key Moment</h3>
              <p className="text-gray-700">{battleResult.keyMoment}</p>
            </div>
          )}

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {battleResult.attackerStrategyAssessment && (
              <div className="rounded-lg bg-green-50 p-4">
                <h3 className="mb-1 font-semibold text-green-800">Attacker Assessment</h3>
                <p className="text-sm text-gray-700">{battleResult.attackerStrategyAssessment}</p>
              </div>
            )}
            {battleResult.defenderStrategyAssessment && (
              <div className="rounded-lg bg-red-50 p-4">
                <h3 className="mb-1 font-semibold text-red-800">Defender Assessment</h3>
                <p className="text-sm text-gray-700">{battleResult.defenderStrategyAssessment}</p>
              </div>
            )}
          </div>

          {battleResult.battleNarrative && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold">Battle Narrative</h3>
              <p className="whitespace-pre-wrap text-gray-700">{battleResult.battleNarrative}</p>
            </div>
          )}

          {battleResult.phases?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Battle Phases</h3>
              {battleResult.phases.map((phase) => (
                <div key={phase.phase} className="rounded-lg border border-gray-200 p-3">
                  <p className="font-medium">
                    Phase {phase.phase}: {phase.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{phase.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
