'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBattleStore } from '@/store/battleStore';

export default function BattlePage() {
  const router = useRouter();
  const { battleSetup, battleResult, isSimulating, simulationError, resetBattle } = useBattleStore();

  // Redirect to home if no battle setup
  useEffect(() => {
    if (!battleSetup) {
      router.push('/');
    }
  }, [battleSetup, router]);

  if (!battleSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading battle setup...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              resetBattle();
              router.push('/');
            }}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Setup
          </button>
          <h1 className="text-3xl font-bold">Battle Simulation</h1>
        </div>

        {/* Battle Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Attacker */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Attacker</h2>
              <p className="text-gray-600">
                <strong>Territory:</strong> {battleSetup.attackingTerritory.name}
              </p>
              <p className="text-gray-600">
                <strong>Troops:</strong> {battleSetup.attackingTroops}
              </p>
              <p className="text-gray-600">
                <strong>Strategy:</strong> {battleSetup.attackerStrategy.name}
              </p>
            </div>

            {/* Defender */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Defender</h2>
              <p className="text-gray-600">
                <strong>Territory:</strong> {battleSetup.defendingTerritory.name}
              </p>
              <p className="text-gray-600">
                <strong>Troops:</strong> {battleSetup.defendingTroops}
              </p>
              <p className="text-gray-600">
                <strong>Strategy:</strong> {battleSetup.defenderStrategy.name}
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Status */}
        {isSimulating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-blue-800">Simulating battle...</p>
          </div>
        )}

        {/* Error State */}
        {simulationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800">Error: {simulationError}</p>
          </div>
        )}

        {/* Battle Result */}
        {battleResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Battle Result</h2>
            <div className="mb-4">
              <p className="text-lg">
                <strong>Winner:</strong> {battleResult.winner === 'attacker' ? 'Attacker' : 'Defender'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600">
                  <strong>Attacker Losses:</strong> {battleResult.attackerStartingTroops - battleResult.attackerRemainingTroops}
                </p>
                <p className="text-gray-600">
                  <strong>Remaining:</strong> {battleResult.attackerRemainingTroops}
                </p>
              </div>
              <div>
                <p className="text-gray-600">
                  <strong>Defender Losses:</strong> {battleResult.defenderStartingTroops - battleResult.defenderRemainingTroops}
                </p>
                <p className="text-gray-600">
                  <strong>Remaining:</strong> {battleResult.defenderRemainingTroops}
                </p>
              </div>
            </div>
            {battleResult.battleNarrative && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Battle Narrative</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{battleResult.battleNarrative}</p>
              </div>
            )}
          </div>
        )}

        {/* Placeholder for battle animation canvas */}
        {!battleResult && !isSimulating && (
          <div className="bg-gray-100 rounded-lg p-6 mb-6 min-h-[400px] flex items-center justify-center">
            <p className="text-gray-500">Battle animation will appear here</p>
          </div>
        )}
      </div>
    </main>
  );
}

