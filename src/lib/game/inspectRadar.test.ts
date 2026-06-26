import { describe, expect, it } from "vitest";
import { buildInspectRadar } from "./inspectRadar";
import type { UnitInspectInfo } from "./unitInspect";

const sample: UnitInspectInfo = {
  id: "farmer_1",
  side: "ally",
  name: "农民",
  hp: 225,
  maxHp: 450,
  atk: 35,
  armor: 5,
  atkSpeed: 0.6,
  rangeLabel: "近战",
  range: "melee",
  description: "test",
};

describe("buildInspectRadar", () => {
  it("returns five normalized axes including current hp ratio", () => {
    const radar = buildInspectRadar(sample);
    expect(radar).toHaveLength(5);
    expect(radar[0]?.label).toBe("生命");
    expect(radar[0]?.value).toBeCloseTo(0.5, 2);
  });
});
