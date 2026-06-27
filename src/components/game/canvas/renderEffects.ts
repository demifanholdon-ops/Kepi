import { ASSET_MANIFEST } from "@/data/assets";
import type { BattleEvent, Enemy, Piece } from "@/types";
import {
  boardToPixel,
  defaultAllyPosition,
  defaultEnemyPosition,
  type BoardMetrics,
} from "@/lib/game/boardLayout";
import { loadCachedImage, type ImageCache } from "@/lib/game/imageCache";
import type { EffectFlash, CanvasRenderState } from "./types";

function resolvePosition(
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

export function buildBattleEffects(
  events: BattleEvent[],
  tick: number,
  allies: Piece[],
  enemies: Enemy[],
): EffectFlash[] {
  const visible = events.slice(0, tick);
  const effects: EffectFlash[] = [];

  for (let i = 0; i < visible.length; i += 1) {
    const event = visible[i]!;
    if (event.type !== "attack") continue;

    const pos = resolvePosition(event.targetId, allies, enemies);
    if (!pos) continue;

    const age = tick - i - 1;
    const fade = Math.max(0.2, 1 - age * 0.28);

    effects.push({
      id: `${event.sourceId}_${event.targetId}_${i}`,
      x: pos.x,
      y: pos.y,
      radius: 14 + event.damage / 7,
      alpha: 0.9 * fade,
      color: event.damage >= 20 ? "#ffd166" : "#f4a261",
      kind: "attack",
    });
  }

  return effects;
}

export function renderEffectsLayer(
  ctx: CanvasRenderingContext2D,
  effects: EffectFlash[],
  metrics: BoardMetrics,
  imageCache: ImageCache,
  requestRepaint: (() => void) | undefined,
): void {
  const attackSprite = loadCachedImage(
    imageCache,
    ASSET_MANIFEST.effects.attack,
    requestRepaint,
  );

  for (const effect of effects) {
    const { x, y } = boardToPixel({ x: effect.x, y: effect.y }, metrics);

    if (attackSprite && effect.kind === "attack") {
      const size = effect.radius * 3.2;
      ctx.save();
      ctx.globalAlpha = effect.alpha;
      ctx.drawImage(attackSprite, x - size / 2, y - size / 2, size, size);
      ctx.restore();
    }

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, effect.radius * 2.2);
    gradient.addColorStop(0, effect.color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.globalAlpha = effect.alpha * 0.55;
    ctx.beginPath();
    ctx.arc(x, y, effect.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawAttackSlashes(
  ctx: CanvasRenderingContext2D,
  slashes: CanvasRenderState["attackSlashes"],
): void {
  for (const slash of slashes) {
    ctx.save();
    ctx.globalAlpha = slash.alpha;
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = slash.width;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(255, 209, 102, 0.65)";
    ctx.shadowBlur = slash.width * 2.2;
    ctx.beginPath();
    ctx.moveTo(slash.sx, slash.sy);
    ctx.lineTo(slash.tx, slash.ty);
    ctx.stroke();
    ctx.restore();
  }
}

export function renderBattleFxLayer(
  ctx: CanvasRenderingContext2D,
  state: Pick<CanvasRenderState, "effects" | "attackSlashes" | "metrics" | "imageCache" | "requestRepaint">,
): void {
  drawAttackSlashes(ctx, state.attackSlashes);
  renderEffectsLayer(
    ctx,
    state.effects,
    state.metrics,
    state.imageCache,
    state.requestRepaint,
  );
}
