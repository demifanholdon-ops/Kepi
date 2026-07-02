import { boardToPixel } from "@/lib/game/boardLayout";
import {
  resolveAllyBoardPosition,
  resolveEnemyBoardPosition,
  UNIT_FEET_OFFSET_RATIO,
  UNIT_SPRITE_HEIGHT_RATIO,
} from "@/lib/game/unitLayout";
import { ENEMY_VISUALS, PIECE_VISUALS } from "@/lib/game/assets";
import type { Piece } from "@/types";
import { loadCachedImage, type ImageCache } from "@/lib/game/imageCache";
import type { CanvasRenderState, CanvasTheme } from "./types";

type UnitDrawJob = {
  id: string;
  pieceType?: Piece["type"];
  x: number;
  y: number;
  sortY: number;
  label: string;
  stroke: string;
  portrait: string;
  placeholder: string;
  visibleBounds?: {
    left: number;
    right: number;
    bottom: number;
  };
  hovered: boolean;
  selected: boolean;
  timeMs: number;
  hpRatio: number;
  showHpBar: boolean;
  preview: boolean;
  motionDx?: number;
  motionDy?: number;
  hitFlash?: number;
};

function loadPortrait(
  cache: ImageCache,
  primary: string,
  fallback: string,
  onLoad?: () => void,
): HTMLImageElement | null {
  const tryLoad = (src: string, allowFallback: boolean): HTMLImageElement | null => {
    const img = loadCachedImage(cache, src, onLoad);
    if (img) return img;
    if (cache.get(src) === "error") {
      if (allowFallback && src !== fallback) return tryLoad(fallback, false);
      return null;
    }
    return null;
  };

  return tryLoad(primary, true);
}

function drawFootShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  feetY: number,
  cellSize: number,
  alpha = 0.28,
): void {
  ctx.save();
  ctx.fillStyle = `rgba(44, 36, 22, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, feetY + cellSize * 0.04, cellSize * 0.28, cellSize * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFootGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  feetY: number,
  cellSize: number,
  stroke: string,
  alpha = 0.5,
): void {
  ctx.save();
  ctx.fillStyle = stroke;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(x, feetY, cellSize * 0.34, cellSize * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha * 0.44;
  ctx.beginPath();
  ctx.ellipse(x, feetY, cellSize * 0.52, cellSize * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPreviewRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  feetY: number,
  cellSize: number,
  stroke: string,
): void {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.45;
  ctx.setLineDash([cellSize * 0.1, cellSize * 0.08]);
  ctx.beginPath();
  ctx.ellipse(x, feetY, cellSize * 0.36, cellSize * 0.13, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSelectedGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  feetY: number,
  cellSize: number,
  timeMs: number,
): void {
  const pulse = 0.72 + 0.28 * Math.sin(timeMs * 0.0045);
  ctx.save();

  const glow = ctx.createRadialGradient(x, feetY, 0, x, feetY, cellSize * 0.52);
  glow.addColorStop(0, `rgba(212, 165, 116, ${0.34 * pulse})`);
  glow.addColorStop(0.45, `rgba(142, 202, 230, ${0.22 * pulse})`);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(x, feetY, cellSize * 0.48, cellSize * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.42 * pulse;
  ctx.fillStyle = "rgba(212, 165, 116, 0.55)";
  ctx.beginPath();
  ctx.ellipse(x, feetY, cellSize * 0.3, cellSize * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHoverRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  feetY: number,
  cellSize: number,
  stroke: string,
): void {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(x, feetY, cellSize * 0.4, cellSize * 0.14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  barY: number,
  cellSize: number,
  hpRatio: number,
): void {
  const barW = cellSize * 0.82;
  const barH = Math.max(3, cellSize * 0.07);
  const barX = x - barW / 2;
  const clamped = Math.max(0, Math.min(1, hpRatio));

  ctx.fillStyle = "rgba(44, 36, 22, 0.55)";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = clamped > 0.35 ? "#52b788" : "#e63946";
  ctx.fillRect(barX, barY, barW * clamped, barH);
  ctx.strokeStyle = "rgba(245, 234, 214, 0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  feetY: number,
  cellSize: number,
  label: string,
  stroke: string,
): void {
  const h = cellSize * 1.4;
  const w = cellSize * 0.72;
  const top = feetY - h;

  ctx.save();
  ctx.fillStyle = "rgba(245, 234, 214, 0.75)";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, top, w, h, cellSize * 0.08);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#2c2416";
  ctx.font = `700 ${cellSize * 0.42}px var(--font-sans, sans-serif)`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, top + h * 0.46);
  ctx.restore();
}

function drawUnit(
  ctx: CanvasRenderingContext2D,
  job: UnitDrawJob,
  cellSize: number,
  cache: ImageCache,
  onLoad?: () => void,
): void {
  const {
    x,
    y,
    label,
    stroke,
    portrait,
    placeholder,
    visibleBounds,
    hovered,
    selected,
    timeMs,
    hpRatio,
    showHpBar,
    preview,
    motionDx = 0,
    motionDy = 0,
    hitFlash = 0,
  } = job;
  const spriteHeight = cellSize * UNIT_SPRITE_HEIGHT_RATIO;
  const feetY = y + cellSize * UNIT_FEET_OFFSET_RATIO;
  const drawXBase = x + motionDx;
  const feetYBase = feetY + motionDy;

  drawFootShadow(ctx, drawXBase, feetYBase, cellSize, preview ? 0.18 : 0.28);
  if (selected) {
    drawSelectedGlow(ctx, drawXBase, feetYBase, cellSize, timeMs);
  }
  if (preview) {
    drawPreviewRing(ctx, drawXBase, feetYBase, cellSize, stroke);
  }
  if (hovered) {
    drawFootGlow(ctx, drawXBase, feetYBase, cellSize, stroke, 0.62);
    drawHoverRing(ctx, drawXBase, feetYBase, cellSize, stroke);
  }

  const portraitImg = loadPortrait(cache, portrait, placeholder, onLoad);
  ctx.save();
  if (preview) {
    ctx.globalAlpha = 0.8;
  }

  if (portraitImg) {
    const aspect = portraitImg.naturalWidth / portraitImg.naturalHeight || 0.75;
    const spriteWidth = spriteHeight * aspect;
    const visibleCenter = visibleBounds
      ? (visibleBounds.left + visibleBounds.right) / 2
      : 0.5;
    const visibleBottom = visibleBounds?.bottom ?? 1;
    const drawX = drawXBase - spriteWidth * visibleCenter;
    const drawY = feetYBase - spriteHeight * visibleBottom;

    ctx.drawImage(portraitImg, drawX, drawY, spriteWidth, spriteHeight);

    if (hitFlash > 0.02) {
      ctx.globalAlpha = hitFlash * 0.55;
      ctx.fillStyle = "#fff5e6";
      ctx.fillRect(drawX, drawY, spriteWidth, spriteHeight);
      ctx.globalAlpha = hitFlash * 0.35;
      ctx.fillStyle = "#e63946";
      ctx.fillRect(drawX, drawY, spriteWidth, spriteHeight);
    }

    const barY = drawY - cellSize * 0.12;
    if (showHpBar) {
      ctx.globalAlpha = 1;
      drawHpBar(ctx, drawXBase, barY, cellSize, hpRatio);
    }
    ctx.restore();
    return;
  }

  drawPlaceholder(ctx, drawXBase, feetYBase, cellSize, label, stroke);
  if (showHpBar) {
    ctx.globalAlpha = 1;
    drawHpBar(ctx, drawXBase, feetYBase - cellSize * 1.55, cellSize, hpRatio);
  }
  ctx.restore();
}

export function renderUnitsLayer(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
  theme: CanvasTheme,
): void {
  const { cellSize } = state.metrics;
  const jobs: UnitDrawJob[] = [];

  const showHpBar = state.phase === "battle" || state.phase === "settlement";
  const enemyPreview = state.phase === "prep";
  const hovered = state.hoveredUnit;

  state.allies.forEach((piece, index) => {
    if (state.phase === "prep" && piece.position === null) return;
    if ((state.phase === "battle" || state.phase === "settlement") && piece.hp <= 0) {
      return;
    }

    const pos = resolveAllyBoardPosition(piece, index);
    const { x, y } = boardToPixel(pos, state.metrics);
    const meta = PIECE_VISUALS[piece.type];
    const motion = state.unitMotionPx[piece.id];
    jobs.push({
      id: piece.id,
      pieceType: piece.type,
      x,
      y,
      sortY: y,
      label: meta.shortLabel,
      stroke: theme.allyStroke,
      portrait: meta.portrait,
      placeholder: meta.placeholder,
      visibleBounds: meta.visibleBounds,
      hovered:
        hovered?.side === "ally" &&
        hovered.unitId === piece.id &&
        !(state.phase === "prep" && state.selectedPieceId),
      selected:
        state.phase === "prep" && state.selectedPieceId === piece.id,
      timeMs: state.timeMs,
      hpRatio: piece.hp / piece.maxHp,
      showHpBar,
      preview: false,
      motionDx: motion?.dx ?? 0,
      motionDy: motion?.dy ?? 0,
      hitFlash: state.hitFlash[piece.id] ?? 0,
    });
  });

  state.enemies.forEach((enemy, index) => {
    if ((state.phase === "battle" || state.phase === "settlement") && enemy.hp <= 0) {
      return;
    }

    const pos = resolveEnemyBoardPosition(enemy, index, state.enemies.length);
    const { x, y } = boardToPixel(pos, state.metrics);
    const meta = ENEMY_VISUALS[enemy.type];
    const motion = state.unitMotionPx[enemy.id];
    jobs.push({
      id: enemy.id,
      x,
      y,
      sortY: y,
      label: meta.shortLabel,
      stroke: theme.enemyStroke,
      portrait: meta.portrait,
      placeholder: meta.placeholder,
      visibleBounds: meta.visibleBounds,
      hovered: hovered?.side === "enemy" && hovered.unitId === enemy.id,
      selected: false,
      timeMs: state.timeMs,
      hpRatio: enemy.hp / enemy.maxHp,
      showHpBar: showHpBar && !enemyPreview,
      preview: enemyPreview,
      motionDx: motion?.dx ?? 0,
      motionDy: motion?.dy ?? 0,
      hitFlash: state.hitFlash[enemy.id] ?? 0,
    });
  });

  jobs.sort((a, b) => a.sortY - b.sortY);

  for (const job of jobs) {
    drawUnit(ctx, job, cellSize, state.portraitCache, state.requestRepaint);
    if (state.phase === "battle" && job.pieceType) {
      drawTulouBattleAura(ctx, job, cellSize, state);
    }
  }

  renderPlacementGhost(ctx, state, theme);
}

function drawTulouBattleAura(
  ctx: CanvasRenderingContext2D,
  job: UnitDrawJob,
  cellSize: number,
  state: CanvasRenderState,
): void {
  const tier = state.homeRepairTier;
  const shield = state.tulouShieldHp[job.id] ?? 0;
  const hasCheatDeath = state.tulouCheatDeathAvailable.includes(job.id);
  const feetY = job.y + cellSize * UNIT_FEET_OFFSET_RATIO;
  const pulse = 0.65 + 0.35 * Math.sin(state.timeMs * 0.005 + job.x * 0.01);

  ctx.save();

  if (tier >= 1 && shield > 0) {
    ctx.globalAlpha = 0.35 * pulse;
    ctx.strokeStyle = "rgba(246, 193, 119, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(job.x, feetY - cellSize * 0.35, cellSize * 0.34, cellSize * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (tier >= 3 && hasCheatDeath) {
    ctx.globalAlpha = 0.42 * pulse;
    ctx.strokeStyle = "rgba(255, 214, 140, 0.9)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.ellipse(job.x, feetY - cellSize * 0.35, cellSize * 0.38, cellSize * 0.52, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function renderPlacementGhost(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
  theme: CanvasTheme,
): void {
  if (state.phase !== "prep" || !state.selectedPieceId || !state.hoveredAllyCell) {
    return;
  }

  const piece = state.allies.find((entry) => entry.id === state.selectedPieceId);
  if (!piece) return;

  const { x, y } = boardToPixel(state.hoveredAllyCell, state.metrics);
  const meta = PIECE_VISUALS[piece.type];
  const { cellSize } = state.metrics;

  drawUnit(
    ctx,
    {
      id: "placement-ghost",
      x,
      y,
      sortY: y,
      label: meta.shortLabel,
      stroke: theme.allyStroke,
      portrait: meta.portrait,
      placeholder: meta.placeholder,
      visibleBounds: meta.visibleBounds,
      hovered: false,
      selected: false,
      timeMs: state.timeMs,
      hpRatio: 1,
      showHpBar: false,
      preview: true,
    },
    cellSize,
    state.portraitCache,
    state.requestRepaint,
  );
}
