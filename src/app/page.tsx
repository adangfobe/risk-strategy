'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RiskMap from '@/components/RiskMap';
import { ReplayListLink } from '@/components/ReplayList';
import StrategyRecorder from '@/components/StrategyRecorder';
import { getTerritory } from '@/lib/map/territories';
import { createClient } from '@/lib/supabase/client';
import { loadGameMeta } from '@/lib/games/api';
import { useBattleStore } from '@/store/battleStore';
import {
  mapTerritoryToTerritory,
  PLAYER_COLOR_HEX,
  type BattleSetup,
  type Player,
} from '@/types';
import { GAME_CONFIG } from '@/lib/config/gameParams';

type StrategyStep = 'idle' | 'attacker' | 'gate' | 'defender' | 'done';

export default function Home() {
  const router = useRouter();
  const activeGameId = useBattleStore((s) => s.activeGameId);
  const players = useBattleStore((s) => s.players);
  const battleHistory = useBattleStore((s) => s.battleHistory);
  const setBattleSetup = useBattleStore((s) => s.setBattleSetup);
  const leaveGame = useBattleStore((s) => s.leaveGame);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !activeGameId) {
      router.push('/games');
    }
  }, [mounted, activeGameId, router]);

  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [attackingTroops, setAttackingTroops] = useState(10);
  const [defendingTroops, setDefendingTroops] = useState(8);
  const [attackerPlayerId, setAttackerPlayerId] = useState<string | null>(null);
  const [defenderPlayerId, setDefenderPlayerId] = useState<string | null>(null);
  const [attackerStrategyText, setAttackerStrategyText] = useState('');
  const [defenderStrategyText, setDefenderStrategyText] = useState('');
  const [strategyStep, setStrategyStep] = useState<StrategyStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [gameMeta, setGameMeta] = useState<{
    name: string | null;
    shareCode: string;
    isHost: boolean;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!activeGameId) return;

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      try {
        const meta = await loadGameMeta(supabase, activeGameId);
        setGameMeta({
          name: meta.name,
          shareCode: meta.share_code,
          isHost: meta.host_user_id === user.id,
        });
      } catch {
        setGameMeta(null);
      }
    });
  }, [activeGameId]);

  useEffect(() => {
    if (players.length === 0) return;
    setAttackerPlayerId((prev) => prev ?? players[0]?.id ?? null);
    setDefenderPlayerId((prev) => prev ?? players[1]?.id ?? players[0]?.id ?? null);
  }, [players]);

  const attacker = useMemo<Player | null>(
    () => players.find((p) => p.id === attackerPlayerId) ?? null,
    [players, attackerPlayerId]
  );
  const defender = useMemo<Player | null>(
    () => players.find((p) => p.id === defenderPlayerId) ?? null,
    [players, defenderPlayerId]
  );

  const handleSelectFrom = useCallback((id: string) => {
    setFromId(id);
    setToId(null);
    setError(null);
  }, []);

  const handleSelectTo = useCallback((id: string) => {
    setToId(id);
    setError(null);
  }, []);

  const handleCopyCode = async () => {
    if (!gameMeta?.shareCode) return;
    await navigator.clipboard.writeText(gameMeta.shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeaveGame = useCallback(() => {
    const confirmed = window.confirm('Leave this game and return to your game list?');
    if (!confirmed) return;

    leaveGame();
    router.push('/games');
  }, [leaveGame, router]);

  const battleReady =
    !!fromId && !!toId && attackingTroops >= 1 && defendingTroops >= 1 && !!attacker && !!defender;

  const canSimulate =
    battleReady &&
    strategyStep === 'done' &&
    attackerStrategyText.trim().length > 0 &&
    defenderStrategyText.trim().length > 0;

  const handleSimulate = () => {
    const from = fromId ? getTerritory(fromId) : null;
    const to = toId ? getTerritory(toId) : null;

    if (!from || !to) {
      setError('Select both territories on the map');
      return;
    }
    if (!attacker || !defender) {
      setError('Choose the attacking and defending players');
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
      attackerColor: attacker.color,
      defenderColor: defender.color,
      attackerName: attacker.name,
      defenderName: defender.name,
    };

    setBattleSetup(setup, attacker.id, defender.id);
    router.push('/battle');
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!activeGameId || players.length === 0) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-lg px-4 pb-8 pt-safe">
      <header className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold">Risk Battle Simulator</h1>
            <p className="mt-1 text-sm text-gray-500">
              Pick territories, speak your strategy, simulate the battle
            </p>
          </div>
          <button
            type="button"
            onClick={handleLeaveGame}
            className="shrink-0 min-h-[44px] rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Games
          </button>
        </div>
      </header>

      {gameMeta?.isHost && (
        <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">You are the host</p>
          <p className="mt-1 text-sm text-amber-800">
            Share this code so others can join and see replays:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-xl font-bold tracking-widest text-amber-900">
              {gameMeta.shareCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="min-h-[36px] rounded-lg border border-amber-300 bg-white px-3 text-sm font-medium text-amber-900"
            >
              {copiedCode ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </section>
      )}

      {/* Roster bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Players
        </span>
        {players.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-sm text-gray-800 shadow-sm"
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: PLAYER_COLOR_HEX[p.color] }}
              aria-hidden
            />
            {p.name}
          </span>
        ))}
      </div>

      <section className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Replays</h2>
        {activeGameId && (
          <ReplayListLink gameId={activeGameId} count={battleHistory.length} />
        )}
      </section>
      {battleHistory.length > 0 && (
        <p className="mb-6 text-sm text-gray-600">
          Battles are saved automatically.{' '}
          <Link href={`/games/${activeGameId}/replays`} className="font-medium text-blue-600">
            Open replay library →
          </Link>
        </p>
      )}

      {/* Step 1: Map */}
      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">1. Select Battle</h2>
        <RiskMap
          fromTerritoryId={fromId}
          toTerritoryId={toId}
          fromColor={attacker ? PLAYER_COLOR_HEX[attacker.color] : undefined}
          toColor={defender ? PLAYER_COLOR_HEX[defender.color] : undefined}
          onSelectFrom={handleSelectFrom}
          onSelectTo={handleSelectTo}
        />
      </section>

      {/* Step 2: Players & Troops */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">2. Players & Troops</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="attacker-player" className="mb-1 block text-sm font-medium text-green-700">
                Attacking player
              </label>
              <select
                id="attacker-player"
                value={attackerPlayerId ?? ''}
                onChange={(e) => setAttackerPlayerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 text-base text-gray-900"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="defender-player" className="mb-1 block text-sm font-medium text-red-700">
                Defending player
              </label>
              <select
                id="defender-player"
                value={defenderPlayerId ?? ''}
                onChange={(e) => setDefenderPlayerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 text-base text-gray-900"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
              className="w-full rounded-lg border border-gray-300 p-3 text-base text-gray-900"
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
              className="w-full rounded-lg border border-gray-300 p-3 text-base text-gray-900"
            />
          </div>
        </div>
      </section>

      {/* Step 3: Pass-and-play strategies */}
      <section className="mb-6 space-y-4">
        <h2 className="text-lg font-semibold">3. Strategies (pass &amp; play)</h2>
        <p className="text-sm text-gray-600">
          Pre-WWI tactics only. Unrealistic parts (aircraft, tanks, nuclear weapons, etc.) are
          automatically dismissed — the rest of your strategy is still used.
        </p>

        {strategyStep === 'idle' && (
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="mb-3 text-sm text-gray-600">
              Strategies are entered one player at a time so no one sees the other&apos;s plan.
            </p>
            <button
              type="button"
              onClick={() => {
                if (!battleReady) {
                  setError('Select territories, players, and troops first');
                  return;
                }
                setAttackerStrategyText('');
                setDefenderStrategyText('');
                setStrategyStep('attacker');
                setError(null);
              }}
              className="min-h-[44px] w-full rounded-lg bg-gray-800 px-4 py-2 font-medium text-white hover:bg-gray-900 disabled:opacity-40"
            >
              Enter strategies
            </button>
          </div>
        )}

        {strategyStep === 'attacker' && (
          <div className="space-y-3">
            <StrategyRecorder
              label={`${attacker?.name ?? 'Attacker'} (attacking)`}
              side="attacker"
              value={attackerStrategyText}
              onChange={setAttackerStrategyText}
              accentClass="border-green-500"
            />
            <button
              type="button"
              onClick={() => {
                if (!attackerStrategyText.trim()) {
                  setError('Enter the attacker strategy first');
                  return;
                }
                setStrategyStep('gate');
                setError(null);
              }}
              className="min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Done — pass device to {defender?.name ?? 'defender'}
            </button>
          </div>
        )}

        {strategyStep === 'gate' && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
            <p className="text-lg font-semibold text-gray-900">
              Pass the device to {defender?.name ?? 'the defender'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {attacker?.name ?? 'The attacker'}&apos;s strategy is now hidden.
            </p>
            <button
              type="button"
              onClick={() => setStrategyStep('defender')}
              className="mt-4 min-h-[44px] w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
            >
              I&apos;m {defender?.name ?? 'the defender'} — enter my strategy
            </button>
          </div>
        )}

        {strategyStep === 'defender' && (
          <div className="space-y-3">
            <StrategyRecorder
              label={`${defender?.name ?? 'Defender'} (defending)`}
              side="defender"
              value={defenderStrategyText}
              onChange={setDefenderStrategyText}
              accentClass="border-red-500"
            />
            <button
              type="button"
              onClick={() => {
                if (!defenderStrategyText.trim()) {
                  setError('Enter the defender strategy first');
                  return;
                }
                setStrategyStep('done');
                setError(null);
              }}
              className="min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Lock in strategies
            </button>
          </div>
        )}

        {strategyStep === 'done' && (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              Strategies locked for both players.
            </p>
            <button
              type="button"
              onClick={() => {
                setAttackerStrategyText('');
                setDefenderStrategyText('');
                setStrategyStep('attacker');
              }}
              className="min-h-[36px] text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Redo
            </button>
          </div>
        )}
      </section>

      {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>}

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
