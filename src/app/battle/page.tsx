'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBattleStore } from '@/store/battleStore';
import BattleVisualizer from '@/components/BattleVisualizer';
import SimulationLoader from '@/components/SimulationLoader';
import { hashBattleSetup } from '@/engine/battleResolver';
import { clearSimulation, registerSimulation } from '@/lib/simulationLock';
import { PLAYER_COLOR_HEX, type BattleResult, type SavedBattle } from '@/types';

function friendlyFetchError(err: unknown): string {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Could not reach the server. Make sure the dev server is running (npm run dev) and try again.';
  }
  return err instanceof Error ? err.message : 'Simulation failed';
}

async function fetchSimulation(battleSetup: NonNullable<ReturnType<typeof useBattleStore.getState>['battleSetup']>): Promise<BattleResult> {
  const res = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ battleSetup }),
  });

  let data: { error?: string; result?: BattleResult };
  try {
    data = await res.json();
  } catch {
    throw new TypeError('Failed to fetch');
  }

  if (!res.ok) throw new Error(data.error || 'Simulation failed');
  if (!data.result) throw new Error('Simulation returned no result');
  return data.result;
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
    addBattleToHistory,
  } = useBattleStore();

  const [hydrated, setHydrated] = useState(false);

  const setupKey = useMemo(
    () => (battleSetup ? hashBattleSetup(battleSetup) : null),
    [battleSetup]
  );

  const historySavedForKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const persist = useBattleStore.persist;
    if (!persist) {
      setHydrated(true);
      return;
    }
    if (persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const saveToHistory = useCallback(
    (result: BattleResult) => {
      if (!battleSetup || !setupKey || historySavedForKeyRef.current === setupKey) return;

      const saved: SavedBattle = {
        id: `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        setup: battleSetup,
        result,
        attackerPlayerId: null,
        defenderPlayerId: null,
      };
      addBattleToHistory(saved);
      historySavedForKeyRef.current = setupKey;
    },
    [battleSetup, setupKey, addBattleToHistory]
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!battleSetup || !setupKey) {
      router.push('/');
    }
  }, [hydrated, battleSetup, setupKey, router]);

  useEffect(() => {
    if (!hydrated || !battleSetup || !setupKey || battleResult) return;

    let cancelled = false;

    setSimulating(true);
    setSimulationError(null);

    const promise = registerSimulation(setupKey, fetchSimulation(battleSetup));

    promise
      .then((result) => {
        if (cancelled) return;
        setBattleResult(result);
        saveToHistory(result);
      })
      .catch((err) => {
        if (cancelled) return;
        clearSimulation(setupKey);
        setSimulationError(friendlyFetchError(err));
      });

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    battleSetup,
    setupKey,
    battleResult,
    setBattleResult,
    setSimulating,
    setSimulationError,
    saveToHistory,
  ]);

  const retrySimulation = useCallback(() => {
    if (!battleSetup || !setupKey) return;

    historySavedForKeyRef.current = null;
    clearSimulation(setupKey);
    setSimulating(true);
    setSimulationError(null);

    registerSimulation(setupKey, fetchSimulation(battleSetup))
      .then((result) => {
        setBattleResult(result);
        saveToHistory(result);
      })
      .catch((err) => {
        clearSimulation(setupKey);
        setSimulationError(friendlyFetchError(err));
      });
  }, [battleSetup, setupKey, setBattleResult, setSimulating, setSimulationError, saveToHistory]);

  if (!hydrated || !battleSetup) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  const awaitingResult = !battleResult && !simulationError;
  const showLoader = isSimulating || awaitingResult;

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

      {showLoader && <SimulationLoader battleSetup={battleSetup} />}

      {!showLoader && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow-md">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-2 text-lg font-semibold text-green-700">
                {battleSetup.attackerName ?? 'Attacker'} (attacking)
              </h2>
              <p className="text-gray-600">
                <strong>From:</strong> {battleSetup.attackingTerritory.name}
              </p>
              <p className="text-gray-600">
                <strong>Troops:</strong> {battleSetup.attackingTroops}
              </p>
              <p className="mt-2 select-text text-sm italic text-gray-700">
                &ldquo;{battleSetup.attackerStrategyText}&rdquo;
              </p>
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold text-red-700">
                {battleSetup.defenderName ?? 'Defender'} (defending)
              </h2>
              <p className="text-gray-600">
                <strong>Territory:</strong> {battleSetup.defendingTerritory.name}
              </p>
              <p className="text-gray-600">
                <strong>Troops:</strong> {battleSetup.defendingTroops}
              </p>
              <p className="mt-2 select-text text-sm italic text-gray-700">
                &ldquo;{battleSetup.defenderStrategyText}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {simulationError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-800">{simulationError}</p>
          <button
            type="button"
            onClick={retrySimulation}
            disabled={isSimulating}
            className="mt-4 min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Try Again
          </button>
        </div>
      )}

      {battleResult && (
        <div className="mb-6">
          <BattleVisualizer
            attackerColor={PLAYER_COLOR_HEX[battleSetup.attackerColor]}
            defenderColor={PLAYER_COLOR_HEX[battleSetup.defenderColor]}
            attackerStart={battleResult.attackerStartingTroops}
            defenderStart={battleResult.defenderStartingTroops}
            attackerRemaining={battleResult.attackerRemainingTroops}
            defenderRemaining={battleResult.defenderRemainingTroops}
            attackerName={battleSetup.attackerName ?? 'Attacker'}
            defenderName={battleSetup.defenderName ?? 'Defender'}
            attackingTerritoryId={battleSetup.attackingTerritory.id}
            defendingTerritoryId={battleSetup.defendingTerritory.id}
            attackingTerritoryName={battleSetup.attackingTerritory.name}
            defendingTerritoryName={battleSetup.defendingTerritory.name}
            phases={battleResult.phases}
            winner={battleResult.winner}
          />
        </div>
      )}

      {battleResult && (
        <div className="rounded-lg bg-white p-4 shadow-md">
          <h2 className="mb-4 text-xl font-bold">Battle Result</h2>
          <p className="mb-4 text-lg">
            <strong>Winner:</strong>{' '}
            {battleResult.winner === 'attacker'
              ? battleSetup.attackerName ?? 'Attacker'
              : battleSetup.defenderName ?? 'Defender'}
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
              <p className="select-text text-gray-700">{battleResult.keyMoment}</p>
            </div>
          )}

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {battleResult.attackerStrategyAssessment && (
              <div className="rounded-lg bg-green-50 p-4">
                <h3 className="mb-1 font-semibold text-green-800">Attacker Assessment</h3>
                <p className="select-text text-sm text-gray-700">
                  {battleResult.attackerStrategyAssessment}
                </p>
              </div>
            )}
            {battleResult.defenderStrategyAssessment && (
              <div className="rounded-lg bg-red-50 p-4">
                <h3 className="mb-1 font-semibold text-red-800">Defender Assessment</h3>
                <p className="select-text text-sm text-gray-700">
                  {battleResult.defenderStrategyAssessment}
                </p>
              </div>
            )}
          </div>

          {battleResult.battleNarrative && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold">Battle Narrative</h3>
              <p className="select-text whitespace-pre-wrap text-gray-700">
                {battleResult.battleNarrative}
              </p>
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
                  <p className="mt-1 select-text text-sm text-gray-600">{phase.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
