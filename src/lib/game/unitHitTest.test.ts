import { describe, expect, it } from "vitest";
import { boardToPixel, computeBoardMetrics, pixelToBoard } from "./boardLayout";
import { hitTestUnits } from "./unitHitTest";
import { pointInHitbox, unitSpriteMetrics } from "./unitLayout";
import type { Enemy, Piece } from "@/types";

describe("hitTestUnits", () => {
  it("detects pointer over an enemy sprite", () => {
    const metrics = computeBoardMetrics(1280, 720);
    const enemies: Enemy[] = [
      {
        id: "enemy_1_0",
        type: "qianhaibei",
        hp: 650,
        maxHp: 650,
        atk: 35,
        atkSpeed: 0.45,
        armor: 20,
        range: "melee",
        position: { x: 3, y: 0 },
      },
    ];
    const sprite = unitSpriteMetrics({ x: 3, y: 0 }, metrics);

    const hit = hitTestUnits(sprite.x, sprite.y, metrics, [], enemies, "prep");
    expect(hit?.side).toBe("enemy");
    expect(hit?.id).toBe("enemy_1_0");
  });

  it("detects pointer over an ally sprite", () => {
    const metrics = computeBoardMetrics(1280, 720);
    const allies: Piece[] = [
      {
        id: "farmer_1",
        type: "farmer",
        cost: 1,
        star: 1,
        hp: 450,
        maxHp: 450,
        atk: 35,
        atkSpeed: 0.6,
        armor: 5,
        range: "melee",
        clan: "hakka",
        position: { x: 3, y: 4 },
      },
    ];
    const sprite = unitSpriteMetrics({ x: 3, y: 4 }, metrics);

    const hit = hitTestUnits(sprite.x, sprite.y, metrics, allies, [], "prep");
    expect(hit?.side).toBe("ally");
    expect(hit?.id).toBe("farmer_1");
  });

  it("back-row ally hitbox overlaps front-row cell (placement must use grid cell first)", () => {
    const metrics = computeBoardMetrics(1280, 720, { allyBottomRatio: 0.5 });
    const col = 3;
    const backRowSprite = unitSpriteMetrics({ x: col, y: 4 }, metrics);
    const frontCellCenter = boardToPixel({ x: col, y: 3 }, metrics);

    expect(pointInHitbox(frontCellCenter.x, frontCellCenter.y, backRowSprite)).toBe(
      true,
    );
    expect(pixelToBoard(frontCellCenter.x, frontCellCenter.y, metrics, true)).toEqual({
      x: col,
      y: 3,
    });
  });

  it("ignores unplaced allies during prep", () => {
    const metrics = computeBoardMetrics(1280, 720);
    const allies: Piece[] = [
      {
        id: "farmer_1",
        type: "farmer",
        cost: 1,
        star: 1,
        hp: 450,
        maxHp: 450,
        atk: 35,
        atkSpeed: 0.6,
        armor: 5,
        range: "melee",
        clan: "hakka",
        position: null,
      },
    ];
    const defaultPos = { x: 0, y: 3 };
    const sprite = unitSpriteMetrics(defaultPos, metrics);

    const hit = hitTestUnits(sprite.x, sprite.y, metrics, allies, [], "prep");
    expect(hit).toBeNull();
  });
});
