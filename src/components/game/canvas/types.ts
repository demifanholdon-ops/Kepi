import type { BattleEvent, Enemy, Piece, ScenePhase } from "@/types";
import type { BoardMetrics } from "@/lib/game/boardLayout";
import type { TulouVisualStage } from "@/lib/game/assets";
import type { ImageCache } from "@/lib/game/imageCache";
import type { TransitionBurst } from "@/lib/game/tulouBackground";
import type { PrepFx } from "@/store/fxStore";

export type CanvasLayerId = "background" | "board" | "units" | "effects";

export type EffectFlash = {
  id: string;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
  kind?: "attack" | "repair";
};

export type CanvasRenderState = {
  metrics: BoardMetrics;
  phase: ScenePhase;
  tulouStage: TulouVisualStage;
  homeRepair: number;
  allies: Piece[];
  enemies: Enemy[];
  allyCellsHighlighted: boolean;
  selectedPieceId: string | null;
  battleEvents: BattleEvent[];
  battleTick: number;
  lastBattleWon: boolean | null;
  effects: EffectFlash[];
  timeMs: number;
  transitionBurst: TransitionBurst | null;
  prepFx: PrepFx[];
  imageCache: ImageCache;
  portraitCache: ImageCache;
  requestRepaint?: () => void;
};

export type CanvasTheme = {
  allyFill: string;
  allyStroke: string;
  enemyFill: string;
  enemyStroke: string;
  boardCell: string;
  boardCellActive: string;
  tulouWall: string;
  tulouRoof: string;
  tulouGlow: string;
  sceneFallback: string;
};

export function readCanvasTheme(stage: TulouVisualStage): CanvasTheme {
  const root = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    root.getPropertyValue(name).trim() || fallback;

  const stageGlow =
    stage === "renewed"
      ? read("--kepi-tulou-glow-renewed", "#f6c177")
      : stage === "repairing"
        ? read("--kepi-tulou-glow-repairing", "#d4a574")
        : read("--kepi-tulou-glow-ruined", "#6b5b4f");

  return {
    allyFill: read("--kepi-ally-fill", "#4a6fa5"),
    allyStroke: read("--kepi-ally-stroke", "#8ecae6"),
    enemyFill: read("--kepi-enemy-fill", "#7b4b4b"),
    enemyStroke: read("--kepi-enemy-stroke", "#c1121f"),
    boardCell: read("--kepi-board-cell", "rgba(255,255,255,0.08)"),
    boardCellActive: read("--kepi-board-cell-active", "rgba(142,202,230,0.22)"),
    tulouWall: read("--kepi-tulou-wall", "#8b6914"),
    tulouRoof: read("--kepi-tulou-roof", "#5c4033"),
    tulouGlow: stageGlow,
    sceneFallback: read("--kepi-scene", "#3d2e1f"),
  };
}
