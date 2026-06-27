import { describe, expect, it } from "vitest";
import { BALANCE } from "@/data/balance";
import { createPiece } from "@/engine/shop";
import {
  advanceBattleTick,
  createBattleSnapshot,
  simulateBattle,
  spawnEnemiesForStage,
} from "./index";

describe("battle outcome", () => {
  it("wins on timeout when allies have more remaining HP%", () => {
    const farmer = createPiece("farmer");
    farmer.position = { x: 0, y: 5 };
    const guard = createPiece("guard");
    guard.position = { x: 1, y: 5 };
    const enemies = spawnEnemiesForStage(1).map((enemy) => ({
      ...enemy,
      hp: 5000,
      maxHp: 5000,
      atk: 6,
      atkSpeed: 0.2,
      armor: 5,
    }));

    const result = simulateBattle({
      stage: 1,
      allies: [farmer, guard],
      enemies,
    });

    expect(result.enemiesRemaining).toBeGreaterThan(0);
    expect(result.alliesRemaining).toBeGreaterThan(0);
    expect(result.allyHpPercent).toBeGreaterThan(result.enemyHpPercent);
    expect(result.won).toBe(true);
  });

  it("loses on timeout when enemies have more remaining HP%", () => {
    const farmer = createPiece("farmer");
    farmer.position = { x: 2, y: 5 };

    const result = simulateBattle({ stage: 1, allies: [farmer] });

    expect(result.alliesRemaining).toBe(0);
    expect(result.won).toBe(false);
  });

  it("wins when every enemy is eliminated", () => {
    const board = ["farmer", "guard", "teacher", "fengshui", "patriarch"].map(
      (type, index) => {
        const piece = createPiece(type as "farmer");
        piece.position = { x: index, y: 5 };
        return piece;
      },
    );

    const result = simulateBattle({ stage: 1, allies: board });

    expect(result.enemiesRemaining).toBe(0);
    expect(result.alliesRemaining).toBeGreaterThan(0);
    expect(result.won).toBe(true);
  });
});

describe("real-time battle ticks", () => {
  it("matches simulateBattle when advanced tick-by-tick", () => {
    const farmer = createPiece("farmer");
    farmer.position = { x: 2, y: 5 };
    const input = { stage: 1, allies: [farmer] };

    const instant = simulateBattle(input);
    let battle = createBattleSnapshot(input);
    let stepped: ReturnType<typeof simulateBattle> | null = null;
    const maxSteps = BALANCE.battle.maxMs / BALANCE.battle.tickMs + 2;

    for (let i = 0; i < maxSteps && !stepped; i += 1) {
      const next = advanceBattleTick(battle);
      battle = next.battle;
      if (next.result) stepped = next.result;
    }

    expect(stepped).not.toBeNull();
    expect(stepped?.won).toBe(instant.won);
    expect(stepped?.events).toEqual(instant.events);
    expect(stepped?.alliesRemaining).toBe(instant.alliesRemaining);
    expect(stepped?.enemiesRemaining).toBe(instant.enemiesRemaining);
  });
});
