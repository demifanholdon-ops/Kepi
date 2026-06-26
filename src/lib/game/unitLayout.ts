import type { BoardMetrics } from "@/lib/game/boardLayout";
import {
  BOARD_COLS,
  boardToPixel,
  defaultAllyPosition,
  defaultEnemyPosition,
  isEnemyRow,
  layoutEnemyPositions,
} from "@/lib/game/boardLayout";
import type { BoardPosition, Enemy, Piece } from "@/types";

export const UNIT_SPRITE_HEIGHT_RATIO = 2.2;
export const UNIT_FEET_OFFSET_RATIO = 0.2;
export const UNIT_HITBOX_WIDTH_RATIO = 0.95;
export const UNIT_HITBOX_HEIGHT_RATIO = 2.05;

export function resolveAllyBoardPosition(piece: Piece, index: number): BoardPosition {
  return piece.position ?? defaultAllyPosition(index);
}

export function resolveEnemyBoardPosition(
  enemy: Enemy,
  index: number,
  total: number,
): BoardPosition {
  const pos = enemy.position;
  if (pos && isEnemyRow(pos.y) && pos.x >= 0 && pos.x < BOARD_COLS) {
    return pos;
  }
  return layoutEnemyPositions(total)[index] ?? defaultEnemyPosition(index, total);
}

export type UnitSpriteMetrics = {
  x: number;
  y: number;
  feetY: number;
  sortY: number;
  cellSize: number;
};

export function unitSpriteMetrics(
  position: BoardPosition,
  metrics: BoardMetrics,
): UnitSpriteMetrics {
  const { x, y } = boardToPixel(position, metrics);
  const feetY = y + metrics.cellSize * UNIT_FEET_OFFSET_RATIO;
  return { x, y, feetY, sortY: y, cellSize: metrics.cellSize };
}

export function unitHitboxRect(sprite: UnitSpriteMetrics): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  const halfW = (sprite.cellSize * UNIT_HITBOX_WIDTH_RATIO) / 2;
  const height = sprite.cellSize * UNIT_HITBOX_HEIGHT_RATIO;
  return {
    left: sprite.x - halfW,
    right: sprite.x + halfW,
    top: sprite.feetY - height,
    bottom: sprite.feetY + sprite.cellSize * 0.12,
  };
}

export function pointInHitbox(
  px: number,
  py: number,
  sprite: UnitSpriteMetrics,
): boolean {
  const box = unitHitboxRect(sprite);
  return px >= box.left && px <= box.right && py >= box.top && py <= box.bottom;
}

export function tooltipAnchorFromSprite(
  sprite: UnitSpriteMetrics,
  canvasRect: DOMRect,
): { anchorX: number; anchorY: number } {
  const headTop = sprite.feetY - sprite.cellSize * UNIT_SPRITE_HEIGHT_RATIO;
  return {
    anchorX: canvasRect.left + sprite.x,
    anchorY: canvasRect.top + headTop - 6,
  };
}
