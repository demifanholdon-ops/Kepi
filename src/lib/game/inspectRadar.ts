import type { UnitInspectInfo } from "@/lib/game/unitInspect";

export type RadarAxis = {
  label: string;
  value: number;
};

/** Normalization caps tuned to当前棋子数值区间. */
const CAPS = {
  atk: 90,
  armor: 30,
  atkSpeed: 0.85,
  range: 3,
} as const;

function clamp01(value: number): number {
  return Math.max(0.08, Math.min(1, value));
}

const RANGE_SCORE = { melee: 1, mid: 2, ranged: 3 } as const;

export function buildInspectRadar(info: UnitInspectInfo): RadarAxis[] {
  const hpRatio = info.maxHp > 0 ? info.hp / info.maxHp : 0;

  return [
    { label: "生命", value: clamp01(hpRatio) },
    { label: "攻击", value: clamp01(info.atk / CAPS.atk) },
    { label: "护甲", value: clamp01(info.armor / CAPS.armor) },
    { label: "攻速", value: clamp01(info.atkSpeed / CAPS.atkSpeed) },
    { label: "射程", value: clamp01(RANGE_SCORE[info.range] / CAPS.range) },
  ];
}

export const INSPECT_CARD_WIDTH = 248;
export const INSPECT_CARD_HEIGHT = 156;
