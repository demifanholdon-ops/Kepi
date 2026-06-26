import {
  allAllyCells,
  allEnemyCells,
  ALLY_ROWS,
  boardToPixel,
  BOARD_COLS,
  ENEMY_ROWS,
  NEUTRAL_ROWS,
  zoneRowBounds,
} from "@/lib/game/boardLayout";
import type { CanvasRenderState, CanvasTheme } from "./types";

export function renderBoardLayer(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
  theme: CanvasTheme,
): void {
  const showZones = state.phase === "prep";
  const { metrics } = state;

  if (showZones) {
    drawZoneBand(ctx, metrics, ENEMY_ROWS, "rgba(193, 18, 31, 0.07)", theme.enemyStroke);
    drawZoneBand(ctx, metrics, NEUTRAL_ROWS, "rgba(245, 234, 214, 0.04)", "rgba(107, 91, 79, 0.25)");
    drawZoneBand(ctx, metrics, ALLY_ROWS, "rgba(74, 111, 165, 0.08)", theme.allyStroke);
    drawZoneDivider(ctx, metrics, NEUTRAL_ROWS[0]!);
    drawZoneLabel(ctx, metrics, ENEMY_ROWS[0]!, "敌阵", theme.enemyStroke);
    drawZoneLabel(ctx, metrics, ALLY_ROWS[0]!, "我阵", theme.allyStroke);
  }

  if (showZones) {
    for (const cell of allEnemyCells()) {
      const { x, y } = boardToPixel(cell, metrics);
      const r = metrics.cellSize * 0.34;
      ctx.fillStyle = "rgba(193,18,31,0.05)";
      ctx.strokeStyle = theme.enemyStroke;
      ctx.lineWidth = 1;
      ctx.globalAlpha = state.enemies.length > 0 ? 0.14 : 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    for (const cell of allAllyCells()) {
      const { x, y } = boardToPixel(cell, metrics);
      const r = metrics.cellSize * 0.34;
      ctx.fillStyle = theme.boardCell;
      ctx.strokeStyle = theme.allyStroke;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (state.allyCellsHighlighted) {
    ctx.fillStyle = theme.boardCellActive;
    ctx.globalAlpha = 0.35;
    for (const cell of allAllyCells()) {
      const { x, y } = boardToPixel(cell, metrics);
      ctx.beginPath();
      ctx.arc(x, y, metrics.cellSize * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

function drawZoneBand(
  ctx: CanvasRenderingContext2D,
  metrics: CanvasRenderState["metrics"],
  rows: readonly number[],
  fill: string,
  stroke: string,
): void {
  const { x, y, w, h } = zoneRowBounds(rows, metrics);
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

function drawZoneDivider(
  ctx: CanvasRenderingContext2D,
  metrics: CanvasRenderState["metrics"],
  neutralRow: number,
): void {
  const y = metrics.originY + neutralRow * metrics.cellSize + metrics.cellSize * 0.5;
  ctx.save();
  ctx.strokeStyle = "rgba(107, 91, 79, 0.28)";
  ctx.lineWidth = 1;
  ctx.setLineDash([metrics.cellSize * 0.18, metrics.cellSize * 0.12]);
  ctx.beginPath();
  ctx.moveTo(metrics.originX, y);
  ctx.lineTo(metrics.originX + BOARD_COLS * metrics.cellSize, y);
  ctx.stroke();
  ctx.restore();
}

function drawZoneLabel(
  ctx: CanvasRenderingContext2D,
  metrics: CanvasRenderState["metrics"],
  row: number,
  text: string,
  color: string,
): void {
  const { x, y } = boardToPixel({ x: 0, y: row }, metrics);
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.font = `600 ${Math.max(11, metrics.cellSize * 0.22)}px var(--font-sans, sans-serif)`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x - metrics.cellSize * 0.55, y);
  ctx.restore();
}
