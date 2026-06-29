'use client';

import { PLAYER_COLOR_HEX, type SavedBattle } from '@/types';

interface BattleHistoryListProps {
  battles: SavedBattle[];
  onReview: (battle: SavedBattle) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function BattleHistoryList({ battles, onReview }: BattleHistoryListProps) {
  if (battles.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Battle History</h2>
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
                onClick={() => onReview(battle)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
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
                    Winner: {winnerName} · {formatTime(battle.timestamp)}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-blue-600">Review</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
