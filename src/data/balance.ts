import type { TulouVisualStage } from "./types";

/** Balance tables — Phase 2. Aligned with PRD V1.6 §6. */
export const BALANCE = {
  snapshotVersion: 1,

  initial: {
    stage: 1,
    totalStages: 6,
    survival: 2,
    kebi: 0,
    kebiThreshold: 5,
    sangzi: 0,
    homeRepair: 0,
    gold: 10,
    population: 3,
    winStreak: 0,
    loseStreak: 0,
    result: null,
  },

  population: {
    max: 6,
    upgradeCost: 4,
  },

  economy: {
    roundWage: 5,
    interestPerTenGold: 1,
    maxInterest: 5,
    shopRefreshCost: 2,
    shopSlotCount: 5,
    streakBonuses: { 2: 1, 3: 2, 4: 3 } as const,
  },

  battle: {
    tickMs: 8,
    maxMs: 40_000,
    ticksPerFrameCap: 22,
    prepTimeSec: 30,
    damageFormula: "atk * 100 / (100 + armor)" as const,
    /** Tuning knob — lowers enemy HP so typical lineups finish before the 40s cap. */
    enemyHpFactor: 0.55,
    /** Tuning knob — global combat damage multiplier. */
    damageMultiplier: 1.75,
  },

  progression: {
    sangziPerWin: 1,
    homeRepairPerWin: 16,
    starHpAtkMultiplier: 2,
  },

  clanSynergy: {
    thresholds: [2, 3, 4] as const,
    atkBonus: [0.1, 0.2, 0.3] as const,
  },

  farmerSkill: {
    goldPerProc: 1,
    roundCooldown: 2,
  },

  teacherSkill: {
    adjacentAtkSpeedBonus: 0.1,
  },

  fengshuiSkill: {
    allyAtkBonus: 0.2,
    durationRounds: 1,
  },

  publicWelfareEvent: {
    atkPenalty: 0.2,
    homeRepairBonus: 10,
  },
} as const;

export const TULOU_VISUAL_STAGES: readonly TulouVisualStage[] = [
  {
    id: "stage1",
    minRepair: 0,
    maxRepair: 15,
    label: "破败",
    boardAsset: "/images/board/kepi_tulou-stage1-broken.png",
    transitionAsset: null,
  },
  {
    id: "stage2",
    minRepair: 16,
    maxRepair: 31,
    label: "井台复水",
    boardAsset: "/images/board/kepi_tulou-stage2-well.png",
    transitionAsset: null,
  },
  {
    id: "stage3",
    minRepair: 32,
    maxRepair: 47,
    label: "墙门修缮",
    boardAsset: "/images/board/kepi_tulou-stage3-gate.png",
    transitionAsset: null,
  },
  {
    id: "stage4",
    minRepair: 48,
    maxRepair: 63,
    label: "屋瓦补齐",
    boardAsset: "/images/board/kepi_tulou-stage4-roof.png",
    transitionAsset: null,
  },
  {
    id: "stage5",
    minRepair: 64,
    maxRepair: 79,
    label: "祠堂点灯",
    boardAsset: "/images/board/kepi_tulou-stage5-lanterns.png",
    transitionAsset: null,
  },
  {
    id: "stage6",
    minRepair: 80,
    maxRepair: 100,
    label: "桑梓焕新",
    boardAsset: "/images/board/kepi_tulou-stage6-renewed.png",
    transitionAsset: null,
  },
] as const;

export function streakBonus(winStreak: number, loseStreak: number): number {
  const streak = Math.max(winStreak, loseStreak);
  if (streak >= 4) return BALANCE.economy.streakBonuses[4];
  if (streak === 3) return BALANCE.economy.streakBonuses[3];
  if (streak === 2) return BALANCE.economy.streakBonuses[2];
  return 0;
}

export function homeRepairVisualStage(
  homeRepair: number,
): TulouVisualStage["id"] {
  const r = Math.max(0, Math.min(100, homeRepair));
  if (r < 16) return "stage1";
  if (r < 32) return "stage2";
  if (r < 48) return "stage3";
  if (r < 64) return "stage4";
  if (r < 80) return "stage5";
  return "stage6";
}

export function tulouStageForRepair(homeRepair: number): TulouVisualStage {
  const id = homeRepairVisualStage(homeRepair);
  return TULOU_VISUAL_STAGES.find((stage) => stage.id === id)!;
}
