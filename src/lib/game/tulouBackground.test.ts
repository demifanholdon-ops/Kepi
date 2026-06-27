import { describe, expect, it } from "vitest";
import {
  resolveTulouBackgroundLayers,
  tulouRepairStageForValue,
} from "./tulouBackground";

describe("resolveTulouBackgroundLayers", () => {
  it("returns ruined stage at low repair", () => {
    const layers = resolveTulouBackgroundLayers(10);
    expect(layers).toHaveLength(1);
    expect(layers[0]?.alpha).toBe(1);
    expect(layers[0]?.src).toContain("stage1-broken");
  });

  it("returns a single direct replacement layer at thresholds", () => {
    const layers = resolveTulouBackgroundLayers(32);
    expect(layers).toHaveLength(1);
    expect(layers[0]?.alpha).toBe(1);
    expect(layers[0]?.src).toContain("stage3-gate");
  });

  it("returns renewed stage at high repair", () => {
    const layers = resolveTulouBackgroundLayers(90);
    expect(layers).toHaveLength(1);
    expect(layers[0]?.src).toContain("stage6-renewed");
  });
});

describe("tulouRepairStageForValue", () => {
  it("maps repair values to six board stages", () => {
    expect(tulouRepairStageForValue(0).src).toBe(
      "/images/board/kepi_tulou-stage1-broken.png",
    );
    expect(tulouRepairStageForValue(0).id).toBe("stage1");
    expect(tulouRepairStageForValue(16).id).toBe("stage2");
    expect(tulouRepairStageForValue(32).id).toBe("stage3");
    expect(tulouRepairStageForValue(48).id).toBe("stage4");
    expect(tulouRepairStageForValue(64).id).toBe("stage5");
    expect(tulouRepairStageForValue(80).id).toBe("stage6");
    expect(tulouRepairStageForValue(100).id).toBe("stage6");
  });
});
