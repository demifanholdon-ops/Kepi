import type { EnemyType } from "@/types";
import { ENEMY_TYPES } from "./enemies";
import type { StageDefinition } from "./types";

const ALL_ENEMIES: readonly EnemyType[] = ENEMY_TYPES;

function stageScaling(stage: number): number {
  if (stage <= 2) return 1;
  if (stage <= 4) return 1.5;
  return 2;
}

function enemyCountForStage(stage: number): number {
  if (stage <= 2) return 3;
  if (stage <= 4) return 4;
  return 5;
}

const STAGE_NAMES = [
  "海禁余波",
  "关隘盘查",
  "契约束缚",
  "荒山阻路",
  "天价归船",
  "风浪前夕",
] as const;

/** Six-stage run — PRD §6.11. */
export const STAGES: readonly StageDefinition[] = Array.from(
  { length: 6 },
  (_, index) => {
    const stage = index + 1;
    const difficulty =
      stage <= 2 ? "tutorial" : stage <= 4 ? "normal" : "hard";

    return {
      stage,
      name: STAGE_NAMES[index]!,
      enemyCount: enemyCountForStage(stage),
      scaling: stageScaling(stage),
      enemyPool: ALL_ENEMIES,
      prepTimeSec: 30,
      difficulty,
      aiDynamic: stage >= 5,
      boardAsset: "/images/board/kepi_tulou-board-main.png",
    } satisfies StageDefinition;
  },
);

export function stageDefinition(stage: number): StageDefinition | undefined {
  return STAGES.find((entry) => entry.stage === stage);
}

export function stageScalingFactor(stage: number): number {
  return stageDefinition(stage)?.scaling ?? stageScaling(stage);
}

export function enemyCount(stage: number): number {
  return stageDefinition(stage)?.enemyCount ?? enemyCountForStage(stage);
}
