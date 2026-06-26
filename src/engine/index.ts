import type { GameAction, GameSnapshot } from "@/types";
import { defaultAllyPosition } from "@/lib/game/boardLayout";
import { simulateBattle } from "./battle";
import {
  INITIAL_GOLD,
  INITIAL_POPULATION,
  SNAPSHOT_VERSION,
} from "./constants";
import { applyRoundIncome } from "./economy";
import { resolveProgression, settleStage } from "./progression";
import {
  buyPiece,
  buyPopulation,
  movePiece,
  refreshShop,
  rollShop,
  recallBoardToBench,
  sellPiece,
} from "./shop";
import { canApplyAction, cloneSnapshot, transitionPhase } from "./stateMachine";

export const ENGINE_VERSION = SNAPSHOT_VERSION;

export function createInitialSnapshot(): GameSnapshot {
  const base: GameSnapshot = {
    version: SNAPSHOT_VERSION,
    phase: "prep",
    state: {
      stage: 1,
      totalStages: 6,
      survival: 2,
      kebi: 0,
      kebiThreshold: 5,
      sangzi: 0,
      homeRepair: 0,
      gold: INITIAL_GOLD,
      population: INITIAL_POPULATION,
      winStreak: 0,
      loseStreak: 0,
      result: null,
    },
    board: [],
    shop: {
      slots: [],
      refreshCost: 2,
    },
    support: [
      { type: "shuike", slot: "shuike" },
      { type: "xiangxian", slot: "xiangxian" },
    ],
    battle: null,
    lastBattleResult: null,
  };

  return rollShop(base);
}

export function reduceGameState(
  snapshot: GameSnapshot,
  action: GameAction,
): GameSnapshot {
  if (!canApplyAction(snapshot, action) && action.type !== "LOAD_SNAPSHOT") {
    return snapshot;
  }

  switch (action.type) {
    case "LOAD_SNAPSHOT":
      return cloneSnapshot(action.snapshot);

    case "BUY_PIECE":
      return buyPiece(snapshot, action.pieceType);

    case "SELL_PIECE":
      return sellPiece(snapshot, action.pieceId);

    case "MOVE_PIECE":
      return movePiece(snapshot, action.pieceId, action.position);

    case "REFRESH_SHOP":
      return refreshShop(snapshot);

    case "BUY_POPULATION":
      return buyPopulation(snapshot);

    case "START_BATTLE": {
      const board = snapshot.board.map((piece, index) =>
        piece.position ? piece : { ...piece, position: defaultAllyPosition(index) },
      );
      const battleResult = simulateBattle({
        stage: snapshot.state.stage,
        allies: board,
      });
      return transitionPhase(
        {
          ...snapshot,
          board,
          lastBattleResult: battleResult,
          battle: null,
        },
        "battle",
      );
    }

    case "END_BATTLE": {
      if (!snapshot.lastBattleResult) {
        return transitionPhase(snapshot, "settlement");
      }
      const settled = settleStage(snapshot, snapshot.lastBattleResult);
      return transitionPhase(settled, "settlement");
    }

    case "ADVANCE_STAGE": {
      let next = resolveProgression(snapshot);
      if (next.phase === "ending") {
        return next;
      }
      next = applyRoundIncome(next);
      next = rollShop(next);
      next = recallBoardToBench(next);
      return transitionPhase(next, "prep");
    }

    default:
      return snapshot;
  }
}

export { calcDamage, simulateBattle, spawnEnemiesForStage } from "./battle";
export { calcInterest, calcStreakBonus, applyRoundIncome } from "./economy";
export {
  homeRepairStage,
  resolveProgression,
  settleStage,
} from "./progression";
export {
  buyPiece,
  buyPopulation,
  createPiece,
  movePiece,
  refreshShop,
  rollShop,
  recallBoardToBench,
  resetPieceCounter,
  sellPiece,
} from "./shop";
export { canApplyAction, cloneSnapshot, transitionPhase } from "./stateMachine";
