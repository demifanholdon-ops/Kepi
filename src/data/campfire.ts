/** Campfire node — local whitelist effects only. */

import { ASSET_MANIFEST } from "./assets";

export type CampfireEffectKind =
  | "gold"
  | "homeRepair"
  | "nextBattleDebuff"
  | "kebiHint";

export type CampfireEffect = {
  kind: CampfireEffectKind;
  gold?: number;
  homeRepair?: number;
  nextBattleEnemyHpFactor?: number;
  label: string;
};

export type CampfireChoice = {
  id: string;
  title: string;
  description: string;
  /** Beat 3 — local feedback after the player confirms. */
  aftermath: string;
  effect: CampfireEffect;
};

export type CampfireBackgroundKey =
  | "campfireNanyangRations"
  | "campfireOldRoute"
  | "campfireVignette";

/** Full-screen glow overlay intensity; prefer baked-in fire on scenario backdrops. */
export type CampfireGlowMode = "none" | "subtle";

export type CampfireScenario = {
  id: string;
  /** Beat 1 — scene paragraphs (local only, no AI). */
  opening: readonly string[];
  /** Beat 2 — short choice prompt under the scene title. */
  prompt: string;
  choices: [CampfireChoice, CampfireChoice];
  /** Cinematic backdrop — see assets-and-media-plan v3 §2.6. */
  backgroundKey: CampfireBackgroundKey;
  /** Optional glow FX layer; `none` when fire is painted into the backdrop. */
  glow?: CampfireGlowMode;
  /** Two-act UI: act 1 subtitle (background story). */
  openingActLabel?: string;
  /** Two-act UI: act 2 subtitle (player choice). */
  choiceActLabel?: string;
  /** Soft hint above the confirm CTA on text-only choice beats. */
  choiceHint?: string;
  /** Split-card confirm flow (select → 今夜如此); effect labels still shown per PRD whitelist. */
  textOnlyChoices?: boolean;
};

export const CAMPFIRE_BACKGROUND_FALLBACK = ASSET_MANIFEST.cinematics.campfireVignette;

export function campfireBackgroundForScenario(scenario: CampfireScenario): string {
  return ASSET_MANIFEST.cinematics[scenario.backgroundKey];
}

export function campfireGlowModeForScenario(scenario: CampfireScenario): CampfireGlowMode {
  return scenario.glow ?? "subtle";
}

export const CAMPFIRE_SCENARIOS: readonly CampfireScenario[] = [
  {
    id: "camp-share-rations",
    backgroundKey: "campfireNanyangRations",
    glow: "none",
    openingActLabel: "第一幕 · 背景",
    choiceActLabel: "第二幕 · 抉择",
    choiceHint: "火光还暖，想好再选。",
    textOnlyChoices: true,
    opening: [
      "民国初年，你在南洋客地讨生活，土楼却在海峡那头日夜入梦。",
      "同乡把一封封侨批叠整齐，低声托你：「水客要启程了，帮我们把信送回家。」",
      "篝火边有人递来半块粿条，热气里全是甜——这是启程前最后一点温存。",
    ],
    prompt: "路还长，这点吃食，你要——",
    choices: [
      {
        id: "share-gold",
        title: "分给大家",
        description: "掰一半给同行，夜里有人替你守更。",
        aftermath: "粿条掰开了，夜里有人替你守更。",
        effect: { kind: "gold", gold: 8, label: "获得 8 金币" },
      },
      {
        id: "share-repair",
        title: "寄回修屋",
        description: "把另一半的心意，换成土楼里的砖瓦。",
        aftermath: "砖瓦记在账上，土楼又亮了一寸。",
        effect: { kind: "homeRepair", homeRepair: 8, label: "家园修复 +8%" },
      },
    ],
  },
  {
    id: "camp-old-route",
    backgroundKey: "campfireOldRoute",
    glow: "subtle",
    openingActLabel: "第一幕 · 背景",
    choiceActLabel: "第二幕 · 抉择",
    choiceHint: "路在脚下，想好再选。",
    textOnlyChoices: true,
    opening: [
      "夜里风紧，老水客压低嗓子。",
      "他讲了一条险路，能抄近，也能稳着走。",
      "下一段是契约束缚——你怎么选？",
    ],
    prompt: "险路在前，你要——",
    choices: [
      {
        id: "route-gold",
        title: "抄近攒盘缠",
        description: "多走一程，多换几枚铜钱。",
        aftermath: "近路多捡了几枚铜钱，鞋底也磨薄了一层。",
        effect: { kind: "gold", gold: 12, label: "获得 12 金币" },
      },
      {
        id: "route-caution",
        title: "稳着走",
        description: "下一场敌人略弱，但收获不增。",
        aftermath: "你记下每一个弯，下一场仗会好打一些。",
        effect: {
          kind: "nextBattleDebuff",
          nextBattleEnemyHpFactor: 0.9,
          label: "下战敌人生命 -10%",
        },
      },
    ],
  },
  {
    id: "camp-letter-dream",
    backgroundKey: "campfireVignette",
    glow: "subtle",
    opening: [
      "夜里梦见阿嬷在门前收信。",
      "梦里的光映在土楼门上，醒后仍灼人。",
    ],
    prompt: "梦醒之后，你要——",
    choices: [
      {
        id: "dream-repair",
        title: "修门待归",
        description: "把梦里的光留在土楼。",
        aftermath: "门楣又紧了一寸，像把梦钉在了家里。",
        effect: { kind: "homeRepair", homeRepair: 12, label: "家园修复 +12%" },
      },
      {
        id: "dream-resolve",
        title: "立誓多带一封",
        description: "心里记牢归乡阈值。",
        aftermath: "你把归乡的数牢牢记下，路便更清晰了。",
        effect: { kind: "kebiHint", label: "归乡目标更清晰（无额外数值）" },
      },
    ],
  },
];

/** Full three-beat cinematic flow — all V3.1 campfire nodes. */
const CINEMATIC_CAMPFIRE_NODE_IDS = new Set(["camp-1", "camp-2"]);

export function campfireUsesCinematicFlow(nodeId: string): boolean {
  return CINEMATIC_CAMPFIRE_NODE_IDS.has(nodeId);
}

export function campfireUsesTextOnlyChoices(scenario: CampfireScenario): boolean {
  return scenario.textOnlyChoices === true;
}

export function campfireScenarioForNode(nodeId: string): CampfireScenario {
  if (nodeId === "camp-2") {
    return CAMPFIRE_SCENARIOS[1]!;
  }
  return CAMPFIRE_SCENARIOS[0]!;
}

export function findCampfireChoice(choiceId: string): CampfireChoice | undefined {
  for (const scenario of CAMPFIRE_SCENARIOS) {
    const match = scenario.choices.find((choice) => choice.id === choiceId);
    if (match) return match;
  }
  return undefined;
}
