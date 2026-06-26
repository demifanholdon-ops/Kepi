/**
 * Engine-facing re-exports from static data.
 * Game rules read configuration from `src/data`, not duplicated literals here.
 */
import type { PieceType, RangeType } from "@/types";
import {
  BALANCE,
  ENEMY_TYPES,
  PIECES,
  enemyCount,
  stageScalingFactor,
  streakBonus as dataStreakBonus,
} from "@/data";

export const SNAPSHOT_VERSION = BALANCE.snapshotVersion;

export const INITIAL_GOLD = BALANCE.initial.gold;
export const INITIAL_POPULATION = BALANCE.initial.population;
export const MAX_POPULATION = BALANCE.population.max;
export const POPULATION_UPGRADE_COST = BALANCE.population.upgradeCost;

export const SHOP_SLOT_COUNT = BALANCE.economy.shopSlotCount;
export const SHOP_REFRESH_COST = BALANCE.economy.shopRefreshCost;

export const ROUND_WAGE = BALANCE.economy.roundWage;
export const INTEREST_PER_TEN_GOLD = BALANCE.economy.interestPerTenGold;
export const MAX_INTEREST = BALANCE.economy.maxInterest;

export const SANGZI_PER_WIN = BALANCE.progression.sangziPerWin;
export const HOME_REPAIR_PER_WIN = BALANCE.progression.homeRepairPerWin;

export const BATTLE_TICK_MS = BALANCE.battle.tickMs;
export const BATTLE_MAX_MS = BALANCE.battle.maxMs;

export type PieceTemplate = {
  cost: number;
  hp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
  range: RangeType;
  clan: string;
};

export const PIECE_TEMPLATES: Record<PieceType, PieceTemplate> = Object.fromEntries(
  Object.entries(PIECES).map(([type, def]) => [
    type,
    {
      cost: def.cost,
      hp: def.hp,
      atk: def.atk,
      atkSpeed: def.atkSpeed,
      armor: def.armor,
      range: def.range,
      clan: def.clan,
    },
  ]),
) as Record<PieceType, PieceTemplate>;

export { ENEMY_TYPES };

export function stageScaling(stage: number): number {
  return stageScalingFactor(stage);
}

export function enemyCountForStage(stage: number): number {
  return enemyCount(stage);
}

export function streakBonus(winStreak: number, loseStreak: number): number {
  return dataStreakBonus(winStreak, loseStreak);
}
