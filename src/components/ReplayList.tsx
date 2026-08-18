'use client';

import Link from 'next/link';
import { PLAYER_COLOR_HEX, type SavedBattle } from '@/types';

interface ReplayListProps {
  battles: SavedBattle[];
  onPlay: (battle: SavedBattle) => void;
  emptyMessage?: string;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReplayList({ battles, onPlay, emptyMessage }: ReplayListProps) {
  if (battles.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        {emptyMessage ?? 'No replays yet. Complete a battle to save one here.'}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {battles.map((battle) => {
        const { setup, result } = battle;
        const attackerWon = result.winner === 'attacker';
        const winnerName = attackerWon
          ? setup.attackerName ?? 'Attacker'
          : setup.defenderName ?? 'Defender';

        return (
          <li key={battle.id}>
            <button
              type="button"
              onClick={() => onPlay(battle)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50/40"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: PLAYER_COLOR_HEX[setup.attackerColor] }}
                    aria-hidden
                  />
                  {setup.attackingTerritory.name}
                  <span className="text-gray-400">→</span>
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: PLAYER_COLOR_HEX[setup.defenderColor] }}
                    aria-hidden
                  />
                  {setup.defendingTerritory.name}
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Winner: {winnerName} · {formatDate(battle.timestamp)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium text-blue-600">Play replay</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ReplayListLink({ gameId, count }: { gameId: string; count: number }) {
  return (
    <Link
      href={`/games/${gameId}/replays`}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:border-blue-300"
    >
      Replays
      {count > 0 && (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
          {count}
        </span>
      )}
    </Link>
  );
}
