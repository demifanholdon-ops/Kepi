import type { BoardPosition } from "@/types";

export const BOARD_COLS = 7;
export const ENEMY_ROWS = [0, 1] as const;
export const NEUTRAL_ROWS = [2] as const;
export const ALLY_ROWS = [3, 4] as const;
export const BOARD_ROWS = 5;

/**
 * Calibrated against 16:9 tulou board PNGs.
 * Row 4 (front ally row) sits just above the shop / bench strip.
 */
export const BOARD_ANCHOR = {
  centerXRatio: 0.5,
  /** Default fallback — kept for tests and non-combat views. */
  allyBottomRatio: 0.52,
  /** Prep phase — fixed anchor; UI chrome floats above canvas. */
  prepAllyBottomRatio: 0.42,
  /** @deprecated Use prepAllyBottomRatio — kept for callers migrating off dock toggle. */
  prepAllyBottomCollapsed: 0.42,
  /** @deprecated Use prepAllyBottomRatio — kept for callers migrating off dock toggle. */
  prepAllyBottomExpanded: 0.42,
  /** Battle / settlement — board wider and lower to fill the stage. */
  battleAllyBottomRatio: 0.62,
  battleBoardWidthRatio: 0.62,
  boardWidthRatio: 0.44,
  boardHeightRatio: 0.34,
} as const;

export type BoardMetricsOptions = {
  allyBottomRatio?: number;
  boardWidthRatio?: number;
};

export type BoardMetrics = {
  width: number;
  height: number;
  originX: number;
  originY: number;
  cellSize: number;
  padding: number;
};

export function computeBoardMetrics(
  width: number,
  height: number,
  options?: BoardMetricsOptions,
): BoardMetrics {
  const allyBottomRatio = options?.allyBottomRatio ?? BOARD_ANCHOR.allyBottomRatio;
  const boardWidthRatio = options?.boardWidthRatio ?? BOARD_ANCHOR.boardWidthRatio;
  const cellSize = Math.min(
    (width * boardWidthRatio) / BOARD_COLS,
    (height * BOARD_ANCHOR.boardHeightRatio) / BOARD_ROWS,
  );

  const boardCenterX = width * BOARD_ANCHOR.centerXRatio;
  const allyFrontRow = ALLY_ROWS[ALLY_ROWS.length - 1]!;
  const allyFrontCenterY = height * allyBottomRatio;

  return {
    width,
    height,
    originX: boardCenterX - (BOARD_COLS * cellSize) / 2,
    originY: allyFrontCenterY - (allyFrontRow + 0.5) * cellSize,
    cellSize,
    padding: Math.min(width, height) * 0.06,
  };
}

export function allyBottomRatioForPrep(_prepDockExpanded?: boolean): number {
  return BOARD_ANCHOR.prepAllyBottomRatio;
}

/** Board anchors for combat phases (battle / settlement) — wider, lower board. */
export function battleBoardAnchors(): {
  allyBottomRatio: number;
  boardWidthRatio: number;
} {
  return {
    allyBottomRatio: BOARD_ANCHOR.battleAllyBottomRatio,
    boardWidthRatio: BOARD_ANCHOR.battleBoardWidthRatio,
  };
}

/**
 * Resolve board anchor options for a given phase.
 * Prep uses the dock-expanded-dependent anchor; combat (battle/settlement)
 * uses the wider, lower battle anchor; other phases fall back to defaults.
 */
export function boardMetricsOptionsForPhase(
  phase: string,
  prepDockExpanded: boolean,
): BoardMetricsOptions | undefined {
  if (phase === "prep") {
    return { allyBottomRatio: allyBottomRatioForPrep(prepDockExpanded) };
  }
  if (phase === "battle" || phase === "settlement") {
    return battleBoardAnchors();
  }
  return undefined;
}

export function boardToPixel(
  position: BoardPosition,
  metrics: BoardMetrics,
): { x: number; y: number } {
  return {
    x: metrics.originX + (position.x + 0.5) * metrics.cellSize,
    y: metrics.originY + (position.y + 0.5) * metrics.cellSize,
  };
}

export function pixelToBoard(
  x: number,
  y: number,
  metrics: BoardMetrics,
  allyOnly: boolean,
): BoardPosition | null {
  const col = Math.floor((x - metrics.originX) / metrics.cellSize);
  const row = Math.floor((y - metrics.originY) / metrics.cellSize);

  if (col < 0 || col >= BOARD_COLS || row < 0 || row > 4) {
    return null;
  }

  const allowedRows = allyOnly
    ? ALLY_ROWS
    : ([...ENEMY_ROWS, ...NEUTRAL_ROWS, ...ALLY_ROWS] as readonly number[]);
  if (!allowedRows.includes(row)) {
    return null;
  }

  return { x: col, y: row };
}

export function defaultAllyPosition(index: number): BoardPosition {
  const row = ALLY_ROWS[Math.floor(index / BOARD_COLS)] ?? ALLY_ROWS[ALLY_ROWS.length - 1]!;
  const col = index % BOARD_COLS;
  return { x: col, y: row };
}

export function spreadColumns(count: number, cols = BOARD_COLS): number[] {
  if (count <= 0) return [];
  if (count === 1) return [Math.floor(cols / 2)];
  return Array.from({ length: count }, (_, i) =>
    Math.round((i * (cols - 1)) / (count - 1)),
  );
}

/** Evenly space enemies across the enemy zone (7 cols × 2 rows). */
export function layoutEnemyPositions(count: number): BoardPosition[] {
  if (count <= 0) return [];

  if (count <= BOARD_COLS) {
    return spreadColumns(count).map((x) => ({ x, y: ENEMY_ROWS[0]! }));
  }

  const row0Count = Math.ceil(count / 2);
  const row1Count = count - row0Count;

  return [
    ...spreadColumns(row0Count).map((x) => ({ x, y: ENEMY_ROWS[0]! })),
    ...spreadColumns(row1Count).map((x) => ({ x, y: ENEMY_ROWS[1]! })),
  ];
}

export function defaultEnemyPosition(index: number, total = 1): BoardPosition {
  return (
    layoutEnemyPositions(total)[index] ?? {
      x: Math.floor(BOARD_COLS / 2),
      y: ENEMY_ROWS[0]!,
    }
  );
}

export function allAllyCells(): BoardPosition[] {
  return ALLY_ROWS.flatMap((y) =>
    Array.from({ length: BOARD_COLS }, (_, x) => ({ x, y })),
  );
}

export function allEnemyCells(): BoardPosition[] {
  return ENEMY_ROWS.flatMap((y) =>
    Array.from({ length: BOARD_COLS }, (_, x) => ({ x, y })),
  );
}

export function isAllyRow(row: number): boolean {
  return (ALLY_ROWS as readonly number[]).includes(row);
}

export function isEnemyRow(row: number): boolean {
  return (ENEMY_ROWS as readonly number[]).includes(row);
}

export function zoneRowBounds(
  rows: readonly number[],
  metrics: BoardMetrics,
): { x: number; y: number; w: number; h: number } {
  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  return {
    x: metrics.originX,
    y: metrics.originY + first * metrics.cellSize,
    w: BOARD_COLS * metrics.cellSize,
    h: (last - first + 1) * metrics.cellSize,
  };
}
