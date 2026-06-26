import type { BattleResult, GameSnapshot } from "@/types";
import {
  HOME_REPAIR_PER_WIN,
  SANGZI_PER_WIN,
} from "../constants";

export function settleStage(
  snapshot: GameSnapshot,
  result: BattleResult,
): GameSnapshot {
  const { state } = snapshot;

  if (result.won) {
    return {
      ...snapshot,
      state: {
        ...state,
        kebi: state.kebi + 1,
        sangzi: state.sangzi + SANGZI_PER_WIN,
        homeRepair: Math.min(100, state.homeRepair + HOME_REPAIR_PER_WIN),
        winStreak: state.winStreak + 1,
        loseStreak: 0,
      },
      lastBattleResult: result,
    };
  }

  return {
    ...snapshot,
    state: {
      ...state,
      survival: state.survival - 1,
      winStreak: 0,
      loseStreak: state.loseStreak + 1,
    },
    lastBattleResult: result,
  };
}

export function resolveProgression(snapshot: GameSnapshot): GameSnapshot {
  const { state } = snapshot;

  if (state.survival <= 0) {
    return {
      ...snapshot,
      phase: "ending",
      state: { ...state, result: "lose" },
    };
  }

  if (state.stage >= state.totalStages) {
    const won = state.kebi >= state.kebiThreshold;
    return {
      ...snapshot,
      phase: "ending",
      state: { ...state, result: won ? "win" : "lose" },
    };
  }

  return {
    ...snapshot,
    state: {
      ...state,
      stage: state.stage + 1,
      result: state.result ?? "playing",
    },
  };
}

export function homeRepairStage(homeRepair: number): "ruined" | "repairing" | "renewed" {
  if (homeRepair < 34) return "ruined";
  if (homeRepair < 67) return "repairing";
  return "renewed";
}
