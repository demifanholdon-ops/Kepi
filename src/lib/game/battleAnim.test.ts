import { describe, expect, it } from "vitest";
import {
  collectNewAttackPulses,
  computeUnitCombatVisuals,
  updateDisplayHpRatios,
} from "./battleAnim";
import { computeBoardMetrics } from "@/lib/game/boardLayout";
import type { BattleEvent } from "@/types";

describe("battleAnim", () => {
  it("collects attack pulses from new events", () => {
    const events: BattleEvent[] = [
      { type: "attack", sourceId: "a1", targetId: "e1", damage: 12 },
      { type: "kill", unitId: "e1" },
    ];
    const pulses = collectNewAttackPulses(events, 0, 1000);
    expect(pulses).toHaveLength(1);
    expect(pulses[0]?.sourceId).toBe("a1");
  });

  it("lerps display hp toward target", () => {
    const display = new Map<string, number>([["u1", 1]]);
    updateDisplayHpRatios(display, [{ id: "u1", hp: 50, maxHp: 100 }], 0.1);
    expect(display.get("u1")).toBeLessThan(1);
    expect(display.get("u1")).toBeGreaterThan(0.4);
  });

  it("adds lunge motion for active attack pulse", () => {
    const allies = [
      {
        id: "a1",
        type: "farmer" as const,
        cost: 1,
        star: 1 as const,
        hp: 100,
        maxHp: 100,
        atk: 10,
        atkSpeed: 1,
        armor: 0,
        range: "melee" as const,
        clan: "farm",
        position: { x: 2, y: 5 },
      },
    ];
    const enemies = [
      {
        id: "e1",
        type: "qianhaibei" as const,
        hp: 100,
        maxHp: 100,
        atk: 10,
        atkSpeed: 1,
        armor: 0,
        range: "melee" as const,
        position: { x: 2, y: 1 },
      },
    ];
    const metrics = computeBoardMetrics(400, 400);

    const { motionPx, hitFlash } = computeUnitCombatVisuals(
      [{ sourceId: "a1", targetId: "e1", damage: 10, startedAt: 1000 }],
      1050,
      allies,
      enemies,
      metrics,
    );

    const motion = motionPx.a1 ?? { dx: 0, dy: 0 };
    expect(Math.hypot(motion.dx, motion.dy)).toBeGreaterThan(0);
    expect(hitFlash.e1).toBeGreaterThan(0);
  });
});
