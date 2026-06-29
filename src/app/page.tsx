'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import RiskMap from '@/components/RiskMap';
import StrategyRecorder from '@/components/StrategyRecorder';
import { getTerritory } from '@/lib/map/territories';
import { useBattleStore } from '@/store/battleStore';
import { mapTerritoryToTerritory, type BattleSetup, type PlayerColor } from '@/types';
import { GAME_CONFIG } from '@/lib/config/gameParams';

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export default function Home() {
  const router = useRouter();
  const setBattleSetup = useBattleStore((s) => s.setBattleSetup);

  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [attackingTroops, setAttackingTroops] = useState(10);
  const [defendingTroops, setDefendingTroops] = useState(8);
  const [attackerStrategyText, setAttackerStrategyText] = useState('');
  const [defenderStrategyText, setDefenderStrategyText] = useState('');
  const [attackerColor, setAttackerColor] = useState<PlayerColor>('red');
  const [defenderColor, setDefenderColor] = useState<PlayerColor>('blue');
  const [error, setError] = useState<string | null>(null);

  const handleSelectFrom = useCallback((id: string) => {
    setFromId(id);
    setToId(null);
    setError(null);
  }, []);

  const handleSelectTo = useCallback((id: string) => {
    setToId(id);
    setError(null);
  }, []);

  const canSimulate =
    fromId &&
    toId &&
    attackingTroops >= 1 &&
    defendingTroops >= 1 &&
    attackerStrategyText.trim().length > 0 &&
    defenderStrategyText.trim().length > 0;

  const handleSimulate = () => {
    const from = fromId ? getTerritory(fromId) : null;
    const to = toId ? getTerritory(toId) : null;

    if (!from || !to) {
      setError('Select both territories on the map');
      return;
    }
    if (!attackerStrategyText.trim() || !defenderStrategyText.trim()) {
      setError('Both players must describe their strategy');
      return;
    }

    const setup: BattleSetup = {
      attackingTerritory: mapTerritoryToTerritory(from),
      defendingTerritory: mapTerritoryToTerritory(to),
      attackingTroops: Math.min(attackingTroops, GAME_CONFIG.MAX_TROOPS_IN_BATTLE),
      defendingTroops: Math.min(defendingTroops, GAME_CONFIG.MAX_TROOPS_IN_BATTLE),
      attackerStrategyText: attackerStrategyText.trim(),
      defenderStrategyText: defenderStrategyText.trim(),
      attackerColor,
      defenderColor,
    };

    setBattleSetup(setup);
    router.push('/battle');
  };

  return (
    <main className="mx-auto min-h-[100dvh] max-w-lg px-4 pb-8 pt-safe">
      <header className="py-4 text-center">
        <h1 className="text-2xl font-bold">Risk Battle Simulator</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick territories, speak your strategy, simulate the battle
        </p>
      </header>

      {/* Step 1: Map */}
      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">1. Select Battle</h2>
        <RiskMap
          fromTerritoryId={fromId}
          toTerritoryId={toId}
          onSelectFrom={handleSelectFrom}
          onSelectTo={handleSelectTo}
        />
      </section>

      {/* Step 2: Troops */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">2. Troop Counts</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="attacking-troops" className="mb-1 block text-sm font-medium text-green-700">
              Attacking troops
            </label>
            <input
              id="attacking-troops"
              type="number"
              min={1}
              max={GAME_CONFIG.MAX_TROOPS_IN_BATTLE}
              value={attackingTroops}
              onChange={(e) => setAttackingTroops(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 p-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="defending-troops" className="mb-1 block text-sm font-medium text-red-700">
              Defending troops
            </label>
            <input
              id="defending-troops"
              type="number"
              min={1}
              max={GAME_CONFIG.MAX_TROOPS_IN_BATTLE}
              value={defendingTroops}
              onChange={(e) => setDefendingTroops(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 p-3 text-base"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="attacker-color" className="mb-1 block text-sm text-gray-600">
                Attacker color
              </label>
              <select
                id="attacker-color"
                value={attackerColor}
                onChange={(e) => setAttackerColor(e.target.value as PlayerColor)}
                className="w-full rounded-lg border border-gray-300 p-3 text-base"
              >
                {PLAYER_COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="defender-color" className="mb-1 block text-sm text-gray-600">
                Defender color
              </label>
              <select
                id="defender-color"
                value={defenderColor}
                onChange={(e) => setDefenderColor(e.target.value as PlayerColor)}
                className="w-full rounded-lg border border-gray-300 p-3 text-base"
              >
                {PLAYER_COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Strategies */}
      <section className="mb-6 space-y-4">
        <h2 className="text-lg font-semibold">3. Voice Strategies</h2>
        <StrategyRecorder
          label="Attacker Strategy"
          side="attacker"
          value={attackerStrategyText}
          onChange={setAttackerStrategyText}
          accentClass="border-green-500"
        />
        <StrategyRecorder
          label="Defender Strategy"
          side="defender"
          value={defenderStrategyText}
          onChange={setDefenderStrategyText}
          accentClass="border-red-500"
        />
      </section>

      {error && (
        <p className="mb-4 text-center text-sm text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSimulate}
        disabled={!canSimulate}
        className="min-h-[52px] w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Simulate Battle
      </button>
    </main>
  );
}
