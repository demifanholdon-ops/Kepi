import { describe, expect, it } from "vitest";
import {
  resolveTransitionOverlay,
  resolveTulouBackgroundLayers,
  transitionBurstForCrossing,
} from "./tulouBackground";

describe("resolveTulouBackgroundLayers", () => {
  it("returns ruined stage at low repair", () => {
    const layers = resolveTulouBackgroundLayers(10);
    expect(layers).toHaveLength(1);
    expect(layers[0]?.alpha).toBe(1);
    expect(layers[0]?.src).toContain("stage1-broken");
  });

  it("crossfades near the first threshold", () => {
    const layers = resolveTulouBackgroundLayers(34);
    expect(layers).toHaveLength(2);
    const total = layers.reduce((sum, layer) => sum + layer.alpha, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("returns renewed stage at high repair", () => {
    const layers = resolveTulouBackgroundLayers(90);
    expect(layers).toHaveLength(1);
    expect(layers[0]?.src).toContain("stage3-renewed");
  });
});

describe("resolveTransitionOverlay", () => {
  it("peaks at threshold 34", () => {
    const overlay = resolveTransitionOverlay(34);
    expect(overlay).not.toBeNull();
    expect(overlay!.alpha).toBeGreaterThan(0.3);
  });

  it("is absent far from thresholds", () => {
    expect(resolveTransitionOverlay(50)).toBeNull();
  });
});

describe("transitionBurstForCrossing", () => {
  it("detects crossing into repairing", () => {
    expect(transitionBurstForCrossing(30, 36)).toContain("transition-1-2");
  });

  it("ignores changes within the same band", () => {
    expect(transitionBurstForCrossing(40, 45)).toBeNull();
  });
});
