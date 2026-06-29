'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import boardData from '@/lib/map/board.json';
import type { BattlePhase } from '@/types';

interface BattleVisualizerProps {
  attackerColor: string;
  defenderColor: string;
  attackerStart: number;
  defenderStart: number;
  attackerRemaining: number;
  defenderRemaining: number;
  attackerName: string;
  defenderName: string;
  attackingTerritoryId: string;
  defendingTerritoryId: string;
  attackingTerritoryName: string;
  defendingTerritoryName: string;
  phases: BattlePhase[];
  winner: 'attacker' | 'defender';
}

interface Soldier {
  startX: number;
  startY: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  deathAt: number;
  alpha: number;
  bob: number;
}

const MAX_SOLDIERS = 36;
const PHASE_MS = 1800;
const TAIL_MS = 1000;

function layoutSoldiers(
  count: number,
  cx: number,
  cy: number,
  spread: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  if (count <= 0) return positions;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    positions.push({
      x: cx + (c - (cols - 1) / 2) * spread,
      y: cy + (r - (rows - 1) / 2) * spread * 0.8,
    });
  }
  return positions;
}

function drawSoldier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  alpha: number,
  facingRight: boolean,
  bob: number
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y + bob);
  if (!facingRight) ctx.scale(-1, 1);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, 4);
  ctx.lineTo(-3, 9);
  ctx.moveTo(2, 4);
  ctx.lineTo(3, 9);
  ctx.stroke();

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(-4, -2, 8, 7);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-4, -2, 8, 7);

  // Head
  ctx.fillStyle = '#fcd9b6';
  ctx.beginPath();
  ctx.arc(0, -6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.stroke();

  // Helmet/hat in team color
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -7, 4.5, Math.PI, 0);
  ctx.fill();

  // Weapon
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(10, -4);
  ctx.stroke();

  ctx.restore();
}

function drawExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha * 0.6;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(x, y, 8 + (1 - alpha) * 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function BattleVisualizer({
  attackerColor,
  defenderColor,
  attackerStart,
  defenderStart,
  attackerRemaining,
  defenderRemaining,
  attackerName,
  defenderName,
  attackingTerritoryId,
  defendingTerritoryId,
  attackingTerritoryName,
  defendingTerritoryName,
  phases,
  winner,
}: BattleVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const attackerSoldiersRef = useRef<Soldier[]>([]);
  const defenderSoldiersRef = useRef<Soldier[]>([]);
  const [phaseLabel, setPhaseLabel] = useState('');
  const [playKey, setPlayKey] = useState(0);

  const phaseCount = Math.max(1, phases.length);
  const totalMs = phaseCount * PHASE_MS + TAIL_MS;

  const mapLayout = useMemo(() => {
    const fromBoard = boardData.territories.find((t) => t.id === attackingTerritoryId);
    const toBoard = boardData.territories.find((t) => t.id === defendingTerritoryId);
    if (!fromBoard?.center || !toBoard?.center) {
      return null;
    }

    const from = fromBoard.center;
    const to = toBoard.center;
    const pad = 120;
    const minX = Math.min(from.x, to.x) - pad;
    const minY = Math.min(from.y, to.y) - pad;
    const maxX = Math.max(from.x, to.x) + pad;
    const maxY = Math.max(from.y, to.y) + pad;
    const vbW = maxX - minX;
    const vbH = maxY - minY;

    return { from, to, minX, minY, vbW, vbH, fromPath: fromBoard.path, toPath: toBoard.path };
  }, [attackingTerritoryId, defendingTerritoryId]);

  const buildSoldiers = useCallback(
    (width: number, height: number) => {
      if (!mapLayout) return;

      const toCanvas = (mx: number, my: number) => ({
        x: ((mx - mapLayout.minX) / mapLayout.vbW) * width,
        y: ((my - mapLayout.minY) / mapLayout.vbH) * height,
      });

      const fromPt = toCanvas(mapLayout.from.x, mapLayout.from.y);
      const toPt = toCanvas(mapLayout.to.x, mapLayout.to.y);

      const maxStart = Math.max(attackerStart, defenderStart, 1);
      const perSoldier = Math.max(1, Math.ceil(maxStart / MAX_SOLDIERS));
      const aDisp = Math.max(1, Math.round(attackerStart / perSoldier));
      const dDisp = Math.max(1, Math.round(defenderStart / perSoldier));
      const aSurv = Math.round(attackerRemaining / perSoldier);
      const dSurv = Math.round(defenderRemaining / perSoldier);

      const spread = Math.min(width, height) * 0.04;
      const aPos = layoutSoldiers(aDisp, fromPt.x, fromPt.y, spread);
      const dPos = layoutSoldiers(dDisp, toPt.x, toPt.y, spread);

      const makeSoldiers = (
        positions: { x: number; y: number }[],
        survivors: number,
        frontSort: (a: { x: number }, b: { x: number }) => number
      ): Soldier[] => {
        const order = positions.map((p, i) => ({ i, p })).sort((a, b) => frontSort(a.p, b.p));
        const casualties = positions.length - Math.max(0, survivors);
        const dying = new Set(order.slice(0, casualties).map((o) => o.i));
        return positions.map((p, i) => ({
          startX: p.x,
          startY: p.y,
          x: p.x,
          y: p.y,
          baseX: p.x,
          baseY: p.y,
          vx: 0,
          vy: 0,
          deathAt: dying.has(i) ? 0.2 + Math.random() * 0.65 : 2,
          alpha: 1,
          bob: Math.random() * Math.PI * 2,
        }));
      };

      attackerSoldiersRef.current = makeSoldiers(aPos, aSurv, (a, b) => b.x - a.x);
      defenderSoldiersRef.current = makeSoldiers(dPos, dSurv, (a, b) => a.x - b.x);
    },
    [mapLayout, attackerStart, defenderStart, attackerRemaining, defenderRemaining]
  );

  // Draw static map layer once per layout/size
  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas || !mapLayout) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Ocean background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#b8d4e8');
    grad.addColorStop(1, '#94b8d4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const scaleX = width / mapLayout.vbW;
    const scaleY = height / mapLayout.vbH;

    const drawTerritory = (pathD: string, fill: string, stroke: string, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(-mapLayout.minX * scaleX, -mapLayout.minY * scaleY);
      ctx.scale(scaleX, scaleY);
      const path = new Path2D(pathD);
      ctx.fillStyle = fill;
      ctx.fill(path);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke(path);
      ctx.restore();
    };

    // Dim all territories
    for (const t of boardData.territories) {
      drawTerritory(t.path, '#d1d5db', '#9ca3af', 0.35);
    }

    // Highlight battle territories
    drawTerritory(mapLayout.fromPath, attackerColor, '#15803d', 0.85);
    drawTerritory(mapLayout.toPath, defenderColor, '#b91c1c', 0.85);

    // March arrow between centers
    const fromX = ((mapLayout.from.x - mapLayout.minX) / mapLayout.vbW) * width;
    const fromY = ((mapLayout.from.y - mapLayout.minY) / mapLayout.vbH) * height;
    const toX = ((mapLayout.to.x - mapLayout.minX) / mapLayout.vbW) * width;
    const toY = ((mapLayout.to.y - mapLayout.minY) / mapLayout.vbH) * height;

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Territory labels
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeText(attackingTerritoryName, fromX, fromY - 14);
    ctx.fillText(attackingTerritoryName, fromX, fromY - 14);
    ctx.strokeText(defendingTerritoryName, toX, toY - 14);
    ctx.fillText(defendingTerritoryName, toX, toY - 14);
  }, [
    mapLayout,
    attackerColor,
    defenderColor,
    attackingTerritoryName,
    defendingTerritoryName,
    playKey,
  ]);

  // Animate soldiers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapLayout) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    buildSoldiers(width, height);
    startTimeRef.current = 0;

    const fromX = ((mapLayout.from.x - mapLayout.minX) / mapLayout.vbW) * width;
    const fromY = ((mapLayout.from.y - mapLayout.minY) / mapLayout.vbH) * height;
    const toX = ((mapLayout.to.x - mapLayout.minX) / mapLayout.vbW) * width;
    const toY = ((mapLayout.to.y - mapLayout.minY) / mapLayout.vbH) * height;
    const clashX = (fromX + toX) / 2;
    const clashY = (fromY + toY) / 2;
    const attackerWins = winner === 'attacker';

    const draw = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const p = Math.min(1, elapsed / totalMs);
      const t = now / 1000;

      const phaseIndex = Math.min(
        phaseCount - 1,
        Math.floor(elapsed / PHASE_MS)
      );
      setPhaseLabel(phases[phaseIndex]?.title ?? '');

      ctx.clearRect(0, 0, width, height);

      const momentum = phases[phaseIndex]?.momentumShift;
      const attackerPush = momentum === 'attacker' ? 0.08 : momentum === 'defender' ? -0.02 : 0.03;
      const defenderPush = momentum === 'defender' ? -0.08 : momentum === 'attacker' ? 0.02 : -0.03;

      const updateSide = (
        soldiers: Soldier[],
        color: string,
        facingRight: boolean,
        marchTargetX: number,
        marchTargetY: number,
        push: number
      ) => {
        for (const s of soldiers) {
          const dead = p >= s.deathAt;
          s.bob = Math.sin(t * 6 + s.startX) * (dead ? 0 : 1.5);

          if (dead) {
            s.vy += 0.4;
            s.y += s.vy;
            s.x += s.vx;
            s.alpha = Math.max(0, s.alpha - 0.035);
            if (s.alpha > 0.1 && s.alpha < 0.5) {
              drawExplosion(ctx, s.x, s.y, s.alpha * 2);
            }
          } else {
            const march = Math.min(1, p * 1.4);
            const targetX = s.startX + (marchTargetX - s.startX) * march * 0.55 + push * width * p;
            const targetY = s.startY + (marchTargetY - s.startY) * march * 0.55;
            s.x += (targetX - s.x) * 0.08;
            s.y += (targetY - s.y) * 0.08 + s.bob * 0.1;
            if (s.vx === 0) s.vx = (Math.random() - 0.5) * 2;
          }

          drawSoldier(ctx, s.x, s.y, color, s.alpha, facingRight, s.bob);
        }
      };

      updateSide(attackerSoldiersRef.current, attackerColor, true, clashX, clashY, attackerPush);
      updateSide(defenderSoldiersRef.current, defenderColor, false, clashX, clashY, defenderPush);

      // Clash burst at center during mid-battle
      if (p > 0.15 && p < 0.85) {
        const burstAlpha = Math.sin(p * Math.PI * 4) * 0.3 + 0.2;
        drawExplosion(ctx, clashX, clashY, burstAlpha);
      }

      // Winner banner fade-in
      if (p > 0.9) {
        const bannerAlpha = (p - 0.9) / 0.1;
        ctx.save();
        ctx.globalAlpha = bannerAlpha;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(width * 0.15, height * 0.42, width * 0.7, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${attackerWins ? attackerName : defenderName} wins!`,
          width / 2,
          height * 0.42 + 23
        );
        ctx.restore();
      }

      if (elapsed < totalMs) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        setPhaseLabel('Battle complete');
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    buildSoldiers,
    mapLayout,
    phases,
    phaseCount,
    totalMs,
    winner,
    attackerColor,
    defenderColor,
    attackerName,
    defenderName,
    playKey,
  ]);

  return (
    <div className="rounded-lg bg-white p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Battle Visualization</h2>
        <button
          type="button"
          onClick={() => setPlayKey((k) => k + 1)}
          className="min-h-[36px] rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ↻ Replay
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between text-sm font-medium">
        <span className="flex items-center gap-1.5" style={{ color: attackerColor }}>
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: attackerColor }} aria-hidden />
          {attackerName} ({attackerStart})
        </span>
        <span className="text-xs text-gray-400">on map</span>
        <span className="flex items-center gap-1.5" style={{ color: defenderColor }}>
          {defenderName} ({defenderStart})
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: defenderColor }} aria-hidden />
        </span>
      </div>

      <div className="relative h-64 w-full overflow-hidden rounded-lg border border-gray-200">
        <canvas
          ref={mapCanvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-label="Animated battle on map"
        />
      </div>

      <p className="mt-2 text-center text-sm font-medium text-gray-700">{phaseLabel}</p>
    </div>
  );
}
