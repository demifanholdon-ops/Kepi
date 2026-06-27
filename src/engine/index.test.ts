import { describe, expect, it } from "vitest";
import type { BattleResult, GameSnapshot } from "@/types";
import {
  createInitialSnapshot,
  reduceGameState,
  resetPieceCounter,
  ENGINE_VERSION,
} from "./index";

function finishBattle(snapshot: GameSnapshot, won: boolean): GameSnapshot {
  const result: BattleResult = {
    won,
    tick: 10,
    elapsedMs: 1000,
    events: [{ type: "roundEnd" }],
    alliesRemaining: won ? 1 : 0,
    enemiesRemaining: won ? 0 : 2,
    allyHpPercent: won ? 80 : 0,
    enemyHpPercent: won ? 0 : 60,
  };
  const settled = reduceGameState(
    { ...snapshot, phase: "battle", lastBattleResult: result },
    { type: "END_BATTLE" },
  );
  if (!won) return settled;
  return reduceGameState(settled, { type: "APPLY_HOME_REPAIR" });
}

function runBattleToCompletion(snapshot: GameSnapshot): GameSnapshot {
  let next = snapshot;
  while (next.phase === "battle" && next.battle && !next.battle.finished) {
    next = reduceGameState(next, { type: "BATTLE_TICK" });
  }
  return reduceGameState(next, { type: "END_BATTLE" });
}

describe("engine", () => {
  it("exports snapshot version", () => {
    expect(ENGINE_VERSION).toBe(1);
  });

  it("runs prep → battle → settlement → next prep loop", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();

    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    expect(snapshot.board).toHaveLength(1);

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    expect(snapshot.phase).toBe("battle");
    expect(snapshot.battle).not.toBeNull();
    expect(snapshot.lastBattleResult).toBeNull();

    snapshot = finishBattle(snapshot, true);
    expect(snapshot.phase).toBe("settlement");

    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.stage).toBe(2);
  });

  it("retries same stage on loss without round income", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();
    const goldBefore = snapshot.state.gold;

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    snapshot = runBattleToCompletion(snapshot);
    expect(snapshot.lastBattleResult?.won).toBe(false);
    expect(snapshot.state.survival).toBe(1);

    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.stage).toBe(1);
    expect(snapshot.state.gold).toBe(goldBefore);
  });

  it("advances stage and pays round income on win", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    const goldAfterBuy = snapshot.state.gold;

    snapshot = finishBattle(snapshot, true);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.stage).toBe(2);
    expect(snapshot.state.gold).toBeGreaterThan(goldAfterBuy);
  });

  it("settles a won stage as shuike collection followed by xiangxian repair", () => {
    resetPieceCounter(0);
    const afterEnd = reduceGameState(
      {
        ...createInitialSnapshot(),
        phase: "battle",
        lastBattleResult: {
          won: true,
          tick: 10,
          elapsedMs: 1000,
          events: [{ type: "roundEnd" }],
          alliesRemaining: 1,
          enemiesRemaining: 0,
          allyHpPercent: 80,
          enemyHpPercent: 0,
        },
      },
      { type: "END_BATTLE" },
    );

    expect(afterEnd.phase).toBe("settlement");
    expect(afterEnd.state.homeRepair).toBe(0);

    const snapshot = reduceGameState(afterEnd, { type: "APPLY_HOME_REPAIR" });

    expect(snapshot.state.kebi).toBe(1);
    expect(snapshot.state.sangzi).toBe(0);
    expect(snapshot.state.homeRepair).toBe(16);
    expect(snapshot.settlement).toMatchObject({
      won: true,
      kebiGained: 1,
      sangziGained: 1,
      sangziConsumed: 1,
      homeRepairBefore: 0,
      homeRepairGained: 16,
      homeRepairAfter: 16,
      survivalLost: 0,
    });
  });

  it("repairs the tulou by one visual stage after each win", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();
    const repairs: number[] = [snapshot.state.homeRepair];

    for (let round = 0; round < 5; round += 1) {
      snapshot = finishBattle(snapshot, true);
      repairs.push(snapshot.state.homeRepair);
      if (round < 4) {
        snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
      }
    }

    expect(repairs).toEqual([0, 16, 32, 48, 64, 80]);
  });

  it("does not collect letters or repair home on loss", () => {
    resetPieceCounter(0);
    const snapshot = finishBattle(createInitialSnapshot(), false);

    expect(snapshot.phase).toBe("settlement");
    expect(snapshot.state.kebi).toBe(0);
    expect(snapshot.state.sangzi).toBe(0);
    expect(snapshot.state.homeRepair).toBe(0);
    expect(snapshot.state.survival).toBe(1);
    expect(snapshot.settlement).toMatchObject({
      won: false,
      kebiGained: 0,
      sangziGained: 0,
      sangziConsumed: 0,
      homeRepairGained: 0,
      survivalLost: 1,
    });
  });

  it("recalls placed pieces to bench when advancing to next prep", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    const pieceId = snapshot.board[0]!.id;
    snapshot = reduceGameState(snapshot, {
      type: "MOVE_PIECE",
      pieceId,
      position: { x: 3, y: 4 },
    });
    expect(snapshot.board[0]?.position).toEqual({ x: 3, y: 4 });

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    snapshot = finishBattle(snapshot, true);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.phase).toBe("prep");
    expect(snapshot.board[0]?.position).toBeNull();
  });

  it("initializes a live battle snapshot on START_BATTLE", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });

    expect(snapshot.phase).toBe("battle");
    expect(snapshot.battle).not.toBeNull();
    expect(snapshot.battle?.finished).toBe(false);
    expect(snapshot.battle?.tick).toBe(0);
    expect(snapshot.lastBattleResult).toBeNull();
    expect(snapshot.battle?.allies).toHaveLength(1);
    expect(snapshot.battle?.enemies.length).toBeGreaterThan(0);
  });

  it("ends game when survival reaches zero", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();

    for (let round = 0; round < 2; round += 1) {
      snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
      snapshot = runBattleToCompletion(snapshot);
      if (snapshot.phase === "ending") break;
      snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    }

    expect(snapshot.phase).toBe("ending");
    expect(snapshot.state.result).toBe("lose");
  });
});
