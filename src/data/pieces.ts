import type { PieceStar, PieceType } from "@/types";
import type { PieceDefinition } from "./types";

const CHARACTER_BASE = "/images/characters";

/** Combat + logistics piece static definitions — PRD V2.0 §5.1–5.2 (1-star base stats). */
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
    description: "廉价前排，人海战术。",
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
    description: "肉盾，水客贴身保镖。",
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
    description: "主力远程输出。",
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
  shuike: {
    type: "shuike",
    name: "水客",
    cost: 1,
    hp: 600,
    atk: 0,
    atkSpeed: 0,
    armor: 5,
    range: "melee",
    clan: "logistics",
    skillId: "shuike_letter",
    description: "0 攻击，客批唯一来源；须上场并存活才能收信。",
    assetId: "shuike",
    portrait: `${CHARACTER_BASE}/kepi_shuike.png`,
  },
  xiangxian: {
    type: "xiangxian",
    name: "乡贤",
    cost: 2,
    hp: 600,
    atk: 25,
    atkSpeed: 0.6,
    armor: 10,
    range: "ranged",
    clan: "logistics",
    skillId: "xiangxian_repair",
    description: "低攻击远程；在场时桑梓→修复转化率 +50%。",
    assetId: "xiangxian",
    portrait: `${CHARACTER_BASE}/kepi_xiangxian.png`,
  },
} as const;

export const PIECE_TYPES = Object.keys(PIECES) as PieceType[];

export function piecePortrait(type: PieceType, star: PieceStar = 1): string {
  const def = PIECES[type];
  if (type === "shuike" || type === "xiangxian") {
    return def.portrait;
  }
  if (star === 1) return def.portrait;
  return `${CHARACTER_BASE}/kepi_${def.assetId}_star${star}.png`;
}
