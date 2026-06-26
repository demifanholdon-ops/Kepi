import { describe, expect, it } from "vitest";
import {
  ALLY_ROWS,
  boardToPixel,
  computeBoardMetrics,
  defaultEnemyPosition,
  ENEMY_ROWS,
  layoutEnemyPositions,
  NEUTRAL_ROWS,
  pixelToBoard,
} from "./boardLayout";

describe("boardLayout zones", () => {
  it("places ally rows near the bottom anchor", () => {
    const metrics = computeBoardMetrics(1280, 720);
    const frontRowY =
      metrics.originY + (ALLY_ROWS[ALLY_ROWS.length - 1]! + 0.5) * metrics.cellSize;
    expect(frontRowY / metrics.height).toBeGreaterThan(0.58);
  });

  it("keeps enemy rows above ally rows with neutral buffer", () => {
    expect(ENEMY_ROWS[ENEMY_ROWS.length - 1]!).toBeLessThan(NEUTRAL_ROWS[0]!);
    expect(NEUTRAL_ROWS[0]!).toBeLessThan(ALLY_ROWS[0]!);
  });

  it("blocks neutral row during prep placement", () => {
    const metrics = computeBoardMetrics(1280, 720);
    const neutral = boardToPixel({ x: 3, y: NEUTRAL_ROWS[0]! }, metrics);
    expect(pixelToBoard(neutral.x, neutral.y, metrics, true)).toBeNull();
  });

  it("spreads enemies evenly on one row", () => {
    const layout = layoutEnemyPositions(3);
    expect(layout.map((p) => p.x)).toEqual([0, 3, 6]);
    expect(layout.every((p) => p.y === ENEMY_ROWS[0])).toBe(true);
  });

  it("splits larger groups across two rows", () => {
    const layout = layoutEnemyPositions(8);
    expect(layout.filter((p) => p.y === 0)).toHaveLength(4);
    expect(layout.filter((p) => p.y === 1)).toHaveLength(4);
  });
});
