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
    tickMs: 100,
    maxMs: 40_000,
    prepTimeSec: 30,
    damageFormula: "atk * 100 / (100 + armor)" as const,
  },

  progression: {
    sangziPerWin: 10,
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
    id: "ruined",
    minRepair: 0,
    maxRepair: 33,
    label: "破败",
    boardAsset: "/images/board/kepi_tulou-stage1-broken.png",
    transitionAsset: "/images/board/kepi_tulou-transition-1-2.png",
  },
  {
    id: "repairing",
    minRepair: 34,
    maxRepair: 66,
    label: "修缮",
    boardAsset: "/images/board/kepi_tulou-stage2-repair.png",
    transitionAsset: "/images/board/kepi_tulou-transition-2-3.png",
  },
  {
    id: "renewed",
    minRepair: 67,
    maxRepair: 100,
    label: "翻新",
    boardAsset: "/images/board/kepi_tulou-stage3-renewed.png",
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
  if (homeRepair < 34) return "ruined";
  if (homeRepair < 67) return "repairing";
  return "renewed";
}

export function tulouStageForRepair(homeRepair: number): TulouVisualStage {
  const id = homeRepairVisualStage(homeRepair);
  return TULOU_VISUAL_STAGES.find((stage) => stage.id === id)!;
}
