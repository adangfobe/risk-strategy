'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  createGame,
  joinGameByCode,
  listUserGames,
  loadGameBattles,
  loadGamePlayers,
  type GameWithMeta,
} from '@/lib/games/api';
import { PLAYER_COLOR_HEX, type PlayerColor } from '@/types';
import { useBattleStore } from '@/store/battleStore';

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

interface DraftPlayer {
  name: string;
  color: PlayerColor;
}

export default function GamesPage() {
  const router = useRouter();
  const setActiveGame = useBattleStore((s) => s.setActiveGame);

  const [games, setGames] = useState<GameWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [gameName, setGameName] = useState('');
  const [drafts, setDrafts] = useState<DraftPlayer[]>([
    { name: '', color: 'red' },
    { name: '', color: 'blue' },
  ]);
  const [creating, setCreating] = useState(false);
  const [createdShareCode, setCreatedShareCode] = useState<string | null>(null);

  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const loadGames = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUserEmail(user.email ?? null);
    setCurrentUserId(user.id);
    try {
      const list = await listUserGames(supabase);
      setGames(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const enterGame = async (gameId: string) => {
    setError(null);
    const supabase = createClient();

    try {
      const players = await loadGamePlayers(supabase, gameId);
      const battles = await loadGameBattles(supabase, gameId);
      setActiveGame(gameId, players, battles);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open game');
    }
  };

  const handleCreate = async () => {
    const named = drafts
      .map((d) => ({ ...d, name: d.name.trim() }))
      .filter((d) => d.name.length > 0);

    if (named.length < 2) {
      setError('Enter at least two player names.');
      return;
    }

    const colors = named.map((d) => d.color);
    if (new Set(colors).size !== colors.length) {
      setError('Each player needs a unique color.');
      return;
    }

    setCreating(true);
    setError(null);
    setCreatedShareCode(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const { gameId, shareCode } = await createGame(
        supabase,
        user.id,
        gameName.trim() || null,
        named
      );
      setCreatedShareCode(shareCode);
      await loadGames();
      await enterGame(gameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim();
    if (!code) {
      setError('Enter a share code.');
      return;
    }

    setJoining(true);
    setError(null);

    const supabase = createClient();
    try {
      const gameId = await joinGameByCode(supabase, code);
      await enterGame(gameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
      setJoining(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const updateDraft = (index: number, patch: Partial<DraftPlayer>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
    setError(null);
  };

  const addPlayer = () => {
    const used = new Set(drafts.map((d) => d.color));
    const nextColor = PLAYER_COLORS.find((c) => !used.has(c)) ?? 'red';
    setDrafts((prev) => [...prev, { name: '', color: nextColor }]);
  };

  if (loading) {
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
          <div>
            <h1 className="text-2xl font-bold">Your games</h1>
            {userEmail && <p className="mt-1 text-sm text-gray-500">{userEmail}</p>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 text-sm text-gray-500 hover:text-gray-800"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Who is the host?</p>
        <p className="mt-1 text-blue-800">
          Whoever creates a new game is the host. Only the host sees the share code on the game
          screen — send it to other players so they can join and watch the same replays.
        </p>
      </section>

      {/* Join with code */}
      <section className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold">Join a game</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Share code"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 p-3 text-base uppercase text-gray-900"
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining}
            className="min-h-[44px] shrink-0 rounded-lg bg-blue-600 px-4 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {joining ? '…' : 'Join'}
          </button>
        </div>
      </section>

      {/* Existing games */}
      {games.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-semibold">Continue a game</h2>
          <ul className="space-y-2">
            {games.map((g) => {
              const isHost = currentUserId === g.host_user_id;
              return (
                <li key={g.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => enterGame(g.id)}
                    className="w-full p-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900">
                        {g.name ?? 'Untitled game'}
                      </span>
                      {isHost && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Host
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {g.member_count} joined · {g.replay_count} replay
                      {g.replay_count !== 1 ? 's' : ''}
                      {isHost && (
                        <span className="ml-2 font-mono text-xs text-gray-600">
                          Code: {g.share_code}
                        </span>
                      )}
                    </p>
                  </button>
                  {g.replay_count > 0 && (
                    <div className="border-t border-gray-100 px-4 py-2">
                      <Link
                        href={`/games/${g.id}/replays`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View {g.replay_count} replay{g.replay_count !== 1 ? 's' : ''} →
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Create game */}
      <section className="rounded-lg border border-gray-200 p-4">
        {!showCreate ? (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="min-h-[44px] w-full rounded-lg border border-dashed border-gray-400 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            + New game (you become host)
          </button>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold">New game</h2>
            <p className="text-sm text-gray-600">
              You will be the host and receive a share code for other accounts to join.
            </p>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Game name (optional)"
              className="w-full rounded-lg border border-gray-300 p-3 text-base text-gray-900"
            />
            {drafts.map((draft, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border border-gray-300 p-3"
              >
                <span
                  className="h-6 w-6 shrink-0 rounded-full border border-black/20"
                  style={{ backgroundColor: PLAYER_COLOR_HEX[draft.color] }}
                  aria-hidden
                />
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => updateDraft(index, { name: e.target.value })}
                  placeholder={`Player ${index + 1}`}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 p-2 text-base text-gray-900"
                />
                <select
                  value={draft.color}
                  onChange={(e) =>
                    updateDraft(index, { color: e.target.value as PlayerColor })
                  }
                  className="rounded-lg border border-gray-300 p-2 text-base text-gray-900"
                >
                  {PLAYER_COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={addPlayer}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + Add player
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-4 font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="min-h-[44px] flex-1 rounded-lg bg-blue-600 px-4 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Start game'}
              </button>
            </div>
          </div>
        )}
      </section>

      {createdShareCode && (
        <p className="mt-4 text-center text-sm text-green-700">
          Game created! Share code: <span className="font-mono font-bold">{createdShareCode}</span>
        </p>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
    </main>
  );
}
