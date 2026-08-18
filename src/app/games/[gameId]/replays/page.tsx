'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { loadGameBattles, loadGameMeta } from '@/lib/games/api';
import ReplayList from '@/components/ReplayList';
import { useBattleStore } from '@/store/battleStore';
import type { SavedBattle } from '@/types';

export default function GameReplaysPage({ params }: { params: { gameId: string } }) {
  const router = useRouter();
  const gameId = params.gameId;
  const loadSavedBattle = useBattleStore((s) => s.loadSavedBattle);

  const [gameName, setGameName] = useState<string | null>(null);
  const [battles, setBattles] = useState<SavedBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const meta = await loadGameMeta(supabase, gameId);
      const replayList = await loadGameBattles(supabase, gameId);
      setGameName(meta.name);
      setBattles(replayList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load replays');
    } finally {
      setLoading(false);
    }
  }, [gameId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePlay = (battle: SavedBattle) => {
    loadSavedBattle(battle);
    router.push('/battle?replay=1');
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-gray-500">Loading replays…</p>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-lg px-4 pb-8 pt-safe">
      <header className="py-4">
        <Link href="/games" className="mb-3 inline-block text-sm text-blue-600 hover:text-blue-800">
          ← Your games
        </Link>
        <h1 className="text-2xl font-bold">Replays</h1>
        <p className="mt-1 text-sm text-gray-500">
          {gameName ?? 'Untitled game'} · shared with everyone in this game
        </p>
      </header>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ReplayList
        battles={battles}
        onPlay={handlePlay}
        emptyMessage="No battles saved yet. Simulate a battle in the game to create a replay."
      />

      <div className="mt-6 flex gap-2">
        <Link
          href="/"
          className="min-h-[44px] flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
        >
          Back to game
        </Link>
      </div>
    </main>
  );
}
