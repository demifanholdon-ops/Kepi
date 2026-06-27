import type { BattleEvent, Enemy, Piece } from "@/types";
import {
  boardToPixel,
  defaultAllyPosition,
  defaultEnemyPosition,
  type BoardMetrics,
} from "@/lib/game/boardLayout";

export type AttackPulse = {
  sourceId: string;
  targetId: string;
  damage: number;
  startedAt: number;
};

export const ATTACK_LUNGE_MS = 130;
export const HIT_FLASH_MS = 150;
export const HP_LERP_SPEED = 16;
export const SLASH_MS = 120;

export function collectNewAttackPulses(
  events: BattleEvent[],
  prevCount: number,
  now: number,
): AttackPulse[] {
  const pulses: AttackPulse[] = [];
  for (let i = prevCount; i < events.length; i += 1) {
    const event = events[i]!;
    if (event.type !== "attack") continue;
    pulses.push({
      sourceId: event.sourceId,
      targetId: event.targetId,
      damage: event.damage,
      startedAt: now,
    });
  }
  return pulses;
}

export function pruneAttackPulses(
  pulses: AttackPulse[],
  now: number,
  maxAgeMs = 420,
): AttackPulse[] {
  return pulses.filter((pulse) => now - pulse.startedAt < maxAgeMs);
}

export function updateDisplayHpRatios(
  display: Map<string, number>,
  units: Array<{ id: string; hp: number; maxHp: number }>,
  dtSec: number,
): void {
  const blend = Math.min(1, dtSec * HP_LERP_SPEED);
  for (const unit of units) {
    const target = unit.maxHp > 0 ? Math.max(0, unit.hp / unit.maxHp) : 0;
    const current = display.get(unit.id);
    const next =
      current === undefined ? target : current + (target - current) * blend;
    display.set(unit.id, next);
  }
}

function resolveBoardPosition(
  unitId: string,
  allies: Piece[],
  enemies: Enemy[],
): { x: number; y: number } | null {
  const allyIndex = allies.findIndex((piece) => piece.id === unitId);
  if (allyIndex >= 0) {
    const piece = allies[allyIndex]!;
    return piece.position ?? defaultAllyPosition(allyIndex);
  }

  const enemyIndex = enemies.findIndex((enemy) => enemy.id === unitId);
  if (enemyIndex >= 0) {
    const enemy = enemies[enemyIndex]!;
    if (enemy.position && enemy.position.x >= 0) {
      return enemy.position;
    }
    return defaultEnemyPosition(enemyIndex, enemies.length);
  }

  return null;
}

function lungeProgress(elapsedMs: number): number {
  const t = Math.max(0, Math.min(1, elapsedMs / ATTACK_LUNGE_MS));
  if (t <= 0.42) {
    const p = t / 0.42;
    return p * p;
  }
  const p = (t - 0.42) / 0.58;
  return 1 - p * p;
}

export function computeUnitCombatVisuals(
  pulses: AttackPulse[],
  now: number,
  allies: Piece[],
  enemies: Enemy[],
  metrics: BoardMetrics,
): {
  motionPx: Record<string, { dx: number; dy: number }>;
  hitFlash: Record<string, number>;
} {
  const motionPx: Record<string, { dx: number; dy: number }> = {};
  const hitFlash: Record<string, number> = {};
  const lungeDist = metrics.cellSize * 0.24;

  for (const pulse of pulses) {
    const elapsed = now - pulse.startedAt;
    const sourcePos = resolveBoardPosition(pulse.sourceId, allies, enemies);
    const targetPos = resolveBoardPosition(pulse.targetId, allies, enemies);
    if (!sourcePos || !targetPos) continue;

    const sourcePx = boardToPixel(sourcePos, metrics);
    const targetPx = boardToPixel(targetPos, metrics);
    const dx = targetPx.x - sourcePx.x;
    const dy = targetPx.y - sourcePx.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;

    if (elapsed < ATTACK_LUNGE_MS) {
      const amount = lungeProgress(elapsed) * lungeDist;
      const existing = motionPx[pulse.sourceId] ?? { dx: 0, dy: 0 };
      const nextDx = nx * amount;
      const nextDy = ny * amount;
      if (Math.hypot(nextDx, nextDy) > Math.hypot(existing.dx, existing.dy)) {
        motionPx[pulse.sourceId] = { dx: nextDx, dy: nextDy };
      }
    }

    if (elapsed < HIT_FLASH_MS) {
      const flash = 1 - elapsed / HIT_FLASH_MS;
      hitFlash[pulse.targetId] = Math.max(hitFlash[pulse.targetId] ?? 0, flash);
    }
  }

  return { motionPx, hitFlash };
}

export type AttackSlash = {
  id: string;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  alpha: number;
  width: number;
};

export function buildAttackSlashes(
  pulses: AttackPulse[],
  now: number,
  allies: Piece[],
  enemies: Enemy[],
  metrics: BoardMetrics,
): AttackSlash[] {
  const slashes: AttackSlash[] = [];

  for (const pulse of pulses) {
    const elapsed = now - pulse.startedAt;
    if (elapsed >= SLASH_MS) continue;

    const sourcePos = resolveBoardPosition(pulse.sourceId, allies, enemies);
    const targetPos = resolveBoardPosition(pulse.targetId, allies, enemies);
    if (!sourcePos || !targetPos) continue;

    const sourcePx = boardToPixel(sourcePos, metrics);
    const targetPx = boardToPixel(targetPos, metrics);
    const progress = elapsed / SLASH_MS;
    const alpha = (1 - progress) * 0.85;

    slashes.push({
      id: `${pulse.sourceId}_${pulse.targetId}_${pulse.startedAt}`,
      sx: sourcePx.x,
      sy: sourcePx.y - metrics.cellSize * 0.55,
      tx: targetPx.x,
      ty: targetPx.y - metrics.cellSize * 0.55,
      alpha,
      width: Math.max(2, metrics.cellSize * 0.06 + pulse.damage / 40),
    });
  }

  return slashes;
}
