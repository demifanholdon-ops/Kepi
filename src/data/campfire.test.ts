import { describe, expect, it } from "vitest";
import { ASSET_MANIFEST } from "./assets";
import {
  campfireBackgroundForScenario,
  campfireGlowModeForScenario,
  campfireScenarioForNode,
  campfireUsesCinematicFlow,
  findCampfireChoice,
} from "./campfire";

describe("campfire data", () => {
  it("uses cinematic flow for both campfire nodes", () => {
    expect(campfireUsesCinematicFlow("camp-1")).toBe(true);
    expect(campfireUsesCinematicFlow("camp-2")).toBe(true);
    expect(campfireUsesCinematicFlow("battle-1")).toBe(false);
  });

  it("maps camp-1 to nanyang rations with two-act text-only flow", () => {
    const scenario = campfireScenarioForNode("camp-1");
    expect(scenario.id).toBe("camp-share-rations");
    expect(scenario.backgroundKey).toBe("campfireNanyangRations");
    expect(scenario.textOnlyChoices).toBe(true);
    expect(scenario.openingActLabel).toBe("第一幕 · 背景");
    expect(scenario.choiceActLabel).toBe("第二幕 · 抉择");
    expect(scenario.choiceHint).toBe("火光还暖，想好再选。");
    expect(scenario.choices[0]?.effect.label).toBe("获得 8 金币");
    expect(scenario.choices[1]?.effect.label).toBe("家园修复 +8%");
    expect(scenario.opening.length).toBeGreaterThanOrEqual(3);
    expect(campfireGlowModeForScenario(scenario)).toBe("none");
    expect(campfireBackgroundForScenario(scenario)).toBe(
      ASSET_MANIFEST.cinematics.campfireNanyangRations,
    );
  });

  it("maps camp-2 to old-route scenario with two-act text-only flow", () => {
    const scenario = campfireScenarioForNode("camp-2");
    expect(scenario.id).toBe("camp-old-route");
    expect(scenario.backgroundKey).toBe("campfireOldRoute");
    expect(scenario.textOnlyChoices).toBe(true);
    expect(scenario.openingActLabel).toBe("第一幕 · 背景");
    expect(scenario.choiceActLabel).toBe("第二幕 · 抉择");
    expect(scenario.choiceHint).toBe("路在脚下，想好再选。");
    expect(campfireGlowModeForScenario(scenario)).toBe("subtle");
    expect(scenario.choices.map((choice) => choice.id)).toEqual([
      "route-gold",
      "route-caution",
    ]);
    expect(scenario.choices[0]?.effect.label).toBe("获得 12 金币");
    expect(scenario.choices[1]?.effect.label).toBe("下战敌人生命 -10%");
  });

  it("applies next battle debuff on route-caution", () => {
    const choice = findCampfireChoice("route-caution");
    expect(choice?.effect.kind).toBe("nextBattleDebuff");
    expect(choice?.effect.nextBattleEnemyHpFactor).toBe(0.9);
  });
});
