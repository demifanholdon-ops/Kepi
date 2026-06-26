import type { PieceType, SupportType } from "@/types";
import type { PieceDefinition, SupportDefinition } from "./types";

const CHARACTER_BASE = "/images/characters";

/** Combat piece static definitions — PRD §6.3 (1-star base stats). */
export const PIECES: Record<PieceType, PieceDefinition> = {
  farmer: {
    type: "farmer",
    name: "农夫",
    cost: 1,
    hp: 450,
    atk: 35,
    atkSpeed: 0.6,
    armor: 5,
    range: "melee",
    clan: "hakka",
    skillId: "farmer_gold",
    description: "每 2 回合产 1 金币，廉价经济位。",
    assetId: "farmer",
    portrait: `${CHARACTER_BASE}/kepi_farmer.png`,
  },
  guard: {
    type: "guard",
    name: "围屋守卫",
    cost: 2,
    hp: 950,
    atk: 40,
    atkSpeed: 0.5,
    armor: 25,
    range: "melee",
    clan: "hakka",
    skillId: "guard_taunt",
    description: "前排坦克，高护甲扛伤。",
    assetId: "guard",
    portrait: `${CHARACTER_BASE}/kepi_guard.png`,
  },
  teacher: {
    type: "teacher",
    name: "教书先生",
    cost: 3,
    hp: 550,
    atk: 45,
    atkSpeed: 0.6,
    armor: 8,
    range: "mid",
    clan: "hakka",
    skillId: "teacher_haste",
    description: "相邻棋子攻速 +10%。",
    assetId: "teacher",
    portrait: `${CHARACTER_BASE}/kepi_teacher.png`,
  },
  fengshui: {
    type: "fengshui",
    name: "风水先生",
    cost: 4,
    hp: 600,
    atk: 60,
    atkSpeed: 0.65,
    armor: 10,
    range: "ranged",
    clan: "hakka",
    skillId: "fengshui_buff",
    description: "预知下波敌人；随机使 1 友方攻击 +20% 一回合。",
    assetId: "fengshui",
    portrait: `${CHARACTER_BASE}/kepi_fengshui.png`,
  },
  patriarch: {
    type: "patriarch",
    name: "族长",
    cost: 5,
    hp: 800,
    atk: 75,
    atkSpeed: 0.7,
    armor: 15,
    range: "mid",
    clan: "hakka",
    skillId: "patriarch_aura",
    description: "全队增益光环，核心输出位。",
    assetId: "patriarch",
    portrait: `${CHARACTER_BASE}/kepi_patriarch.png`,
  },
} as const;

/** Support units fixed at game start — PRD §5.1.3A. */
export const SUPPORT_UNITS: Record<SupportType, SupportDefinition> = {
  shuike: {
    type: "shuike",
    name: "水客",
    costTier: 2.5,
    hp: 500,
    atk: 0,
    atkSpeed: 0,
    armor: 5,
    range: null,
    description: "纯运信收信：每场胜利客批 +1，信里桑梓值随信收回。",
    assetId: "shuike",
    portrait: `${CHARACTER_BASE}/kepi_shuike.png`,
  },
  xiangxian: {
    type: "xiangxian",
    name: "乡贤",
    costTier: 3.5,
    hp: 600,
    atk: 25,
    atkSpeed: 0.6,
    armor: 10,
    range: "mid",
    description: "消耗桑梓值修家园，驱动土楼三阶段视觉。",
    assetId: "xiangxian",
    portrait: `${CHARACTER_BASE}/kepi_xiangxian.png`,
  },
} as const;

export const PIECE_TYPES = Object.keys(PIECES) as PieceType[];

export function piecePortrait(type: PieceType, star: 1 | 2 | 3 = 1): string {
  const def = PIECES[type];
  if (star === 1) return def.portrait;
  return `${CHARACTER_BASE}/kepi_${def.assetId}_star${star}.png`;
}
