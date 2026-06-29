'use client';

import { useEffect, useState } from 'react';
import { PLAYER_COLOR_HEX, type BattleSetup } from '@/types';

const STATUS_MESSAGES = [
  'Analyzing battlefield terrain…',
  'Evaluating attacker strategy…',
  'Assessing defensive positions…',
  'Calculating troop movements…',
  'Simulating combat phases…',
  'Determining casualties…',
  'Writing battle narrative…',
];

interface SimulationLoaderProps {
  battleSetup: BattleSetup;
}

export default function SimulationLoader({ battleSetup }: SimulationLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2200);
    return () => clearInterval(msgTimer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        return p + Math.random() * 8 + 2;
      });
    }, 600);
    return () => clearInterval(progressTimer);
  }, []);

  const attackerColor = PLAYER_COLOR_HEX[battleSetup.attackerColor];
  const defenderColor = PLAYER_COLOR_HEX[battleSetup.defenderColor];

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white shadow-md">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <div
              className="absolute inset-2 animate-pulse rounded-full"
              style={{ backgroundColor: `${attackerColor}33` }}
            />
          </div>
          <div>
            <p className="text-lg font-semibold text-blue-900">Simulating Battle</p>
            <p className="text-sm text-blue-600">AI is resolving the conflict…</p>
          </div>
        </div>

        {/* Clash preview */}
        <div className="relative mb-6 flex items-center justify-between rounded-lg bg-white/80 px-4 py-5">
          <div className="flex flex-col items-center gap-1 text-center">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
              style={{ backgroundColor: attackerColor }}
            >
              ⚔
            </span>
            <p className="text-sm font-semibold text-gray-900">
              {battleSetup.attackerName ?? 'Attacker'}
            </p>
            <p className="text-xs text-gray-500">{battleSetup.attackingTerritory.name}</p>
            <p className="text-sm font-medium" style={{ color: attackerColor }}>
              {battleSetup.attackingTroops} troops
            </p>
          </div>

          <div className="flex flex-col items-center px-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-2 w-2 animate-bounce rounded-full bg-amber-400"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-600">vs</p>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
              style={{ backgroundColor: defenderColor }}
            >
              🛡
            </span>
            <p className="text-sm font-semibold text-gray-900">
              {battleSetup.defenderName ?? 'Defender'}
            </p>
            <p className="text-xs text-gray-500">{battleSetup.defendingTerritory.name}</p>
            <p className="text-sm font-medium" style={{ color: defenderColor }}>
              {battleSetup.defendingTroops} troops
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>

        <p className="animate-pulse text-center text-sm text-gray-600">
          {STATUS_MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  );
}
