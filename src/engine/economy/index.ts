import type { GameSnapshot } from "@/types";
import {
  INTEREST_PER_TEN_GOLD,
  MAX_INTEREST,
  ROUND_WAGE,
  streakBonus,
} from "../constants";

export function calcInterest(gold: number): number {
  const raw = Math.floor(gold / 10) * INTEREST_PER_TEN_GOLD;
  return Math.min(raw, MAX_INTEREST);
}

export function calcStreakBonus(winStreak: number, loseStreak: number): number {
  return streakBonus(winStreak, loseStreak);
}

export function applyRoundIncome(snapshot: GameSnapshot): GameSnapshot {
  const { state } = snapshot;
  const interest = calcInterest(state.gold);
  const bonus = calcStreakBonus(state.winStreak, state.loseStreak);
  const income = ROUND_WAGE + interest + bonus;

  return {
    ...snapshot,
    state: {
      ...state,
      gold: state.gold + income,
    },
  };
}
