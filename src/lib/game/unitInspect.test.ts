import { describe, expect, it } from "vitest";
import { inspectShopPiece } from "./unitInspect";

describe("inspectShopPiece", () => {
  it("returns 1-star template stats with shop badge", () => {
    const info = inspectShopPiece("guard");
    expect(info.name).toBe("围屋守卫");
    expect(info.hp).toBe(950);
    expect(info.badge).toBe("商店");
    expect(info.star).toBe(1);
  });
});
