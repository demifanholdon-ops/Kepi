import { ASSET_MANIFEST } from "@/data/assets";
import { TULOU_BOARD_ASSETS } from "@/lib/game/assets";

export type BackgroundLayer = {
  src: string;
  alpha: number;
};

export type TransitionBurst = {
  src: string;
  progress: number;
};

/** Half-width of the crossfade band around each stage threshold (34 / 67). */
const TRANSITION_BAND = 8;

export function resolveTulouBackgroundLayers(homeRepair: number): BackgroundLayer[] {
  const r = Math.max(0, Math.min(100, homeRepair));

  if (r <= 34 - TRANSITION_BAND) {
    return [{ src: TULOU_BOARD_ASSETS.ruined, alpha: 1 }];
  }

  if (r < 34 + TRANSITION_BAND) {
    const t = (r - (34 - TRANSITION_BAND)) / (TRANSITION_BAND * 2);
    return [
      { src: TULOU_BOARD_ASSETS.ruined, alpha: 1 - t },
      { src: TULOU_BOARD_ASSETS.repairing, alpha: t },
    ];
  }

  if (r <= 67 - TRANSITION_BAND) {
    return [{ src: TULOU_BOARD_ASSETS.repairing, alpha: 1 }];
  }

  if (r < 67 + TRANSITION_BAND) {
    const t = (r - (67 - TRANSITION_BAND)) / (TRANSITION_BAND * 2);
    return [
      { src: TULOU_BOARD_ASSETS.repairing, alpha: 1 - t },
      { src: TULOU_BOARD_ASSETS.renewed, alpha: t },
    ];
  }

  return [{ src: TULOU_BOARD_ASSETS.renewed, alpha: 1 }];
}

/** Subtle transition art overlay while homeRepair sits near a threshold. */
export function resolveTransitionOverlay(homeRepair: number): BackgroundLayer | null {
  const r = Math.max(0, Math.min(100, homeRepair));

  if (r >= 30 && r <= 38) {
    const peak = 1 - Math.abs(r - 34) / 4;
    if (peak <= 0) return null;
    return {
      src: ASSET_MANIFEST.board.tulouTransition12,
      alpha: peak * 0.42,
    };
  }

  if (r >= 63 && r <= 71) {
    const peak = 1 - Math.abs(r - 67) / 4;
    if (peak <= 0) return null;
    return {
      src: ASSET_MANIFEST.board.tulouTransition23,
      alpha: peak * 0.42,
    };
  }

  return null;
}

export function transitionBurstForCrossing(
  prevRepair: number,
  nextRepair: number,
): string | null {
  if (prevRepair < 34 && nextRepair >= 34) {
    return ASSET_MANIFEST.board.tulouTransition12;
  }
  if (prevRepair < 67 && nextRepair >= 67) {
    return ASSET_MANIFEST.board.tulouTransition23;
  }
  return null;
}

export const TULOU_BACKGROUND_SRCS = [
  TULOU_BOARD_ASSETS.ruined,
  TULOU_BOARD_ASSETS.repairing,
  TULOU_BOARD_ASSETS.renewed,
  ASSET_MANIFEST.board.tulouTransition12,
  ASSET_MANIFEST.board.tulouTransition23,
] as const;
