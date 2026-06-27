import { TULOU_BOARD_ASSETS, type TulouRepairStage } from "@/lib/game/assets";

export type BackgroundLayer = {
  src: string;
  alpha: number;
};

export type TulouRepairStageDefinition = {
  id: TulouRepairStage;
  minRepair: number;
  maxRepair: number;
  src: string;
};

export const TULOU_REPAIR_STAGE_DEFINITIONS: readonly TulouRepairStageDefinition[] = [
  { id: "stage1", minRepair: 0, maxRepair: 15, src: TULOU_BOARD_ASSETS.stage1 },
  { id: "stage2", minRepair: 16, maxRepair: 31, src: TULOU_BOARD_ASSETS.stage2 },
  { id: "stage3", minRepair: 32, maxRepair: 47, src: TULOU_BOARD_ASSETS.stage3 },
  { id: "stage4", minRepair: 48, maxRepair: 63, src: TULOU_BOARD_ASSETS.stage4 },
  { id: "stage5", minRepair: 64, maxRepair: 79, src: TULOU_BOARD_ASSETS.stage5 },
  { id: "stage6", minRepair: 80, maxRepair: 100, src: TULOU_BOARD_ASSETS.stage6 },
] as const;

export function tulouRepairStageForValue(homeRepair: number): TulouRepairStageDefinition {
  const r = Number.isFinite(homeRepair)
    ? Math.max(0, Math.min(100, homeRepair))
    : 0;
  return (
    TULOU_REPAIR_STAGE_DEFINITIONS.find(
      (stage) => r >= stage.minRepair && r <= stage.maxRepair,
    ) ?? TULOU_REPAIR_STAGE_DEFINITIONS[TULOU_REPAIR_STAGE_DEFINITIONS.length - 1]!
  );
}

export function resolveTulouBackgroundLayers(homeRepair: number): BackgroundLayer[] {
  return [{ src: tulouRepairStageForValue(homeRepair).src, alpha: 1 }];
}

export const TULOU_BACKGROUND_SRCS = [
  TULOU_BOARD_ASSETS.stage1,
  TULOU_BOARD_ASSETS.stage2,
  TULOU_BOARD_ASSETS.stage3,
  TULOU_BOARD_ASSETS.stage4,
  TULOU_BOARD_ASSETS.stage5,
  TULOU_BOARD_ASSETS.stage6,
] as const;
