import { BOARD_ANCHOR } from "./boardLayout";
import {
  JOURNEY_SIDE_RAIL_BENCH_GAP_REM,
  JOURNEY_SIDE_RAIL_WIDTH_REM,
} from "./sideRailLayout";

/** @deprecated Bench floats inside stage grid cell; dock height no longer affects placement. */
export const BOTTOM_SHOP_HEIGHT_REM = 10.5;
/** Collapsed letter strip (header + narrative line + padding). */
export const BOTTOM_LETTER_STRIP_REM = 5.5;
export const BOTTOM_LETTER_EXPANDED_EXTRA_REM = 5.5;
export const BOTTOM_STACK_GAP_REM = 0.5;
/** Gap between bench float and the dock stack above it. */
export const BOTTOM_BENCH_CLEARANCE_REM = 1.25;
/** Conservative fallback before the dock is measured (expanded letter + shop warnings). */
export const BOTTOM_BENCH_FALLBACK_EXTRA_REM = 2;
/** Left gutter inset for the bench dock (ratio of viewport width). */
export const BENCH_DOCK_LEFT_RATIO = 0.05;
/** Keep bench clear of the ally grid's left edge. */
export const BENCH_DOCK_BOARD_GAP_RATIO = 0.02;

/** Fixed prep bottom dock height (approx). */
export const BOTTOM_PREP_DOCK_COLLAPSED_REM = 3.25;
export const BOTTOM_PREP_DOCK_EXPANDED_REM = 16;

export function benchBottomRemForPrep(): number {
  return BOTTOM_PREP_DOCK_EXPANDED_REM + BOTTOM_BENCH_CLEARANCE_REM;
}

export function benchDockBottomOffset(
  dockHeightPx: number,
  rootFontSizePx: number,
  fallbackBottomRem: number,
): string {
  if (dockHeightPx > 0) {
    const clearancePx = BOTTOM_BENCH_CLEARANCE_REM * rootFontSizePx;
    return `${Math.ceil(dockHeightPx + clearancePx)}px`;
  }
  return `${fallbackBottomRem}rem`;
}

/** Pin the bench dock beside the ally board, clear of the journey side rail. */
export function benchDockStyle(
  bottom: string,
  options: { sideRailVisible?: boolean } = {},
): {
  bottom: string;
  left: string;
  maxWidth: string;
} {
  const { sideRailVisible = true } = options;
  const boardLeftRatio =
    BOARD_ANCHOR.centerXRatio - BOARD_ANCHOR.boardWidthRatio / 2;
  const railOffsetRem = sideRailVisible
    ? JOURNEY_SIDE_RAIL_WIDTH_REM + JOURNEY_SIDE_RAIL_BENCH_GAP_REM
    : 0;
  const maxWidthRatio = Math.max(
    0.16,
    boardLeftRatio - BENCH_DOCK_LEFT_RATIO - BENCH_DOCK_BOARD_GAP_RATIO,
  );

  return {
    bottom,
    left: `max(calc(${railOffsetRem}rem + 0.375rem), calc(${railOffsetRem}rem + env(safe-area-inset-left)))`,
    maxWidth: `min(20rem, ${maxWidthRatio * 100}%)`,
  };
}
