'use client';

import { useState } from 'react';
import { PLAYER_COLOR_HEX, type Player, type PlayerColor } from '@/types';

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

interface DraftPlayer {
  name: string;
  color: PlayerColor;
}

function makeId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

interface RosterSetupProps {
  onStart: (players: Player[]) => void;
}

export default function RosterSetup({ onStart }: RosterSetupProps) {
  const [drafts, setDrafts] = useState<DraftPlayer[]>([
    { name: '', color: 'red' },
    { name: '', color: 'blue' },
  ]);
  const [error, setError] = useState<string | null>(null);

  const updateDraft = (index: number, patch: Partial<DraftPlayer>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
    setError(null);
  };

  const addPlayer = () => {
    const used = new Set(drafts.map((d) => d.color));
    const nextColor = PLAYER_COLORS.find((c) => !used.has(c)) ?? 'red';
    setDrafts((prev) => [...prev, { name: '', color: nextColor }]);
  };

  const removePlayer = (index: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    const named = drafts
      .map((d) => ({ ...d, name: d.name.trim() }))
      .filter((d) => d.name.length > 0);

    if (named.length < 2) {
      setError('Enter at least two player names to start.');
      return;
    }

    const colors = named.map((d) => d.color);
    if (new Set(colors).size !== colors.length) {
      setError('Each player needs a unique color.');
      return;
    }

    onStart(named.map((d) => ({ id: makeId(), name: d.name, color: d.color })));
  };

  return (
    <main className="mx-auto min-h-[100dvh] max-w-lg px-4 pb-8 pt-safe">
      <header className="py-4 text-center">
        <h1 className="text-2xl font-bold">Risk Battle Simulator</h1>
        <p className="mt-1 text-sm text-gray-500">New game — add your players to begin</p>
      </header>

      <section className="space-y-3">
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
              placeholder={`Player ${index + 1} name`}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 p-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={draft.color}
              onChange={(e) => updateDraft(index, { color: e.target.value as PlayerColor })}
              className="rounded-lg border border-gray-300 p-2 text-base text-gray-900"
              aria-label={`Player ${index + 1} color`}
            >
              {PLAYER_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {drafts.length > 2 && (
              <button
                type="button"
                onClick={() => removePlayer(index)}
                className="min-h-[36px] shrink-0 rounded-lg px-2 text-sm text-gray-500 hover:text-red-600"
                aria-label={`Remove player ${index + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </section>

      <button
        type="button"
        onClick={addPlayer}
        className="mt-3 min-h-[44px] w-full rounded-lg border border-dashed border-gray-400 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        + Add player
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleStart}
        className="mt-6 min-h-[52px] w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
      >
        Start Game
      </button>
    </main>
  );
}
