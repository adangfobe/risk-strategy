'use client';

import { useCallback, useMemo, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import boardData from '@/lib/map/board.json';
import { getTerritory, getAdjacent, areAdjacent } from '@/lib/map/territories';

type SelectionMode = 'from' | 'to';

interface RiskMapProps {
  fromTerritoryId: string | null;
  toTerritoryId: string | null;
  onSelectFrom: (id: string) => void;
  onSelectTo: (id: string) => void;
}

const continentStyles = Object.fromEntries(
  boardData.continents.map((c) => [c.id, { fill: c.fill, stroke: c.stroke }])
);

function getTerritoryStyle(
  territoryId: string,
  fromId: string | null,
  toId: string | null,
  eligibleIds: Set<string>
): { fill: string; stroke: string; opacity: number } {
  const territory = getTerritory(territoryId);
  const base = continentStyles[territory?.continent ?? ''] ?? { fill: '#ccc', stroke: '#999' };

  if (territoryId === fromId) {
    return { fill: '#22c55e', stroke: '#15803d', opacity: 1 };
  }
  if (territoryId === toId) {
    return { fill: '#ef4444', stroke: '#b91c1c', opacity: 1 };
  }
  if (fromId && eligibleIds.has(territoryId)) {
    return { fill: '#fbbf24', stroke: '#d97706', opacity: 1 };
  }
  if (fromId) {
    return { ...base, opacity: 0.35 };
  }
  return { ...base, opacity: 1 };
}

export default function RiskMap({
  fromTerritoryId,
  toTerritoryId,
  onSelectFrom,
  onSelectTo,
}: RiskMapProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const eligibleIds = useMemo(() => {
    if (!fromTerritoryId) return new Set<string>();
    return new Set(getAdjacent(fromTerritoryId).map((t) => t.id));
  }, [fromTerritoryId]);

  const handleTerritoryTap = useCallback(
    (id: string) => {
      setPendingId(id);

      if (!fromTerritoryId || (fromTerritoryId && toTerritoryId)) {
        onSelectFrom(id);
        return;
      }

      if (id === fromTerritoryId) {
        onSelectFrom(id);
        return;
      }

      if (areAdjacent(fromTerritoryId, id)) {
        onSelectTo(id);
      }
    },
    [fromTerritoryId, toTerritoryId, onSelectFrom, onSelectTo]
  );

  const fromName = fromTerritoryId ? getTerritory(fromTerritoryId)?.name : null;
  const toName = toTerritoryId ? getTerritory(toTerritoryId)?.name : null;
  const pendingName = pendingId ? getTerritory(pendingId)?.name : null;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap gap-2">
        {fromName && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            From: {fromName}
          </span>
        )}
        {toName && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            Target: {toName}
          </span>
        )}
        {!fromName && (
          <span className="text-sm text-gray-500">Tap a territory to attack from</span>
        )}
        {fromName && !toName && (
          <span className="text-sm text-gray-500">Tap an adjacent territory to attack</span>
        )}
      </div>

      {pendingName && (
        <p className="mb-2 text-center text-base font-semibold text-gray-800">
          Selected: {pendingName}
        </p>
      )}

      <div className="relative h-[50dvh] min-h-[280px] w-full overflow-hidden rounded-lg border border-gray-200 bg-sky-50">
        <TransformWrapper
          initialScale={1}
          minScale={0.8}
          maxScale={4}
          centerOnInit
          wheel={{ disabled: true }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full flex items-center justify-center"
          >
            <svg
              viewBox="0 0 1024 792"
              className="h-full w-full touch-none"
              role="img"
              aria-label="Risk world map"
            >
              <rect width="1024" height="792" fill="#b8d4e8" />
              {boardData.territories.map((t) => {
                const style = getTerritoryStyle(
                  t.id,
                  fromTerritoryId,
                  toTerritoryId,
                  eligibleIds
                );
                const territory = getTerritory(t.id);
                const continentStyle = continentStyles[territory?.continent ?? ''];

                return (
                  <path
                    key={t.id}
                    id={t.id}
                    d={t.path}
                    fill={style.fill}
                    stroke={style.stroke || continentStyle?.stroke || '#333'}
                    strokeWidth={2}
                    opacity={style.opacity}
                    className="cursor-pointer transition-opacity duration-150"
                    onClick={() => handleTerritoryTap(t.id)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleTerritoryTap(t.id);
                    }}
                  >
                    <title>{territory?.name ?? t.id}</title>
                  </path>
                );
              })}
            </svg>
          </TransformComponent>
        </TransformWrapper>
      </div>

      <p className="mt-2 text-center text-xs text-gray-400">
        Pinch to zoom · drag to pan
      </p>
    </div>
  );
}
