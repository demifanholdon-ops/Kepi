import { describe, expect, it } from "vitest";
import {
  benchBottomRemForPrep,
  benchDockBottomOffset,
  BOTTOM_BENCH_CLEARANCE_REM,
  BOTTOM_PREP_DOCK_EXPANDED_REM,
} from "./bottomLayout";

describe("bottomLayout", () => {
  it("uses measured dock height when available", () => {
    expect(benchDockBottomOffset(320, 16, 20)).toBe(
      `${320 + BOTTOM_BENCH_CLEARANCE_REM * 16}px`,
    );
  });

  it("falls back to rem estimate before dock is measured", () => {
    expect(benchDockBottomOffset(0, 16, 22)).toBe("22rem");
  });

  it("reserves clearance for the fixed prep bottom dock", () => {
    expect(benchBottomRemForPrep()).toBe(
      BOTTOM_PREP_DOCK_EXPANDED_REM + BOTTOM_BENCH_CLEARANCE_REM,
    );
  });
});
