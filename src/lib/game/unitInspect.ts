import { ENEMIES } from "@/data/enemies";
import { PIECES } from "@/data/pieces";
import type { Enemy, Piece, PieceType, RangeType, ScenePhase } from "@/types";

const RANGE_LABELS: Record<RangeType, string> = {
  melee: "近战",
  mid: "中程",
  ranged: "远程",
};

export type UnitInspectInfo = {
  id: string;
  side: "ally" | "enemy";
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  armor: number;
  atkSpeed: number;
  rangeLabel: string;
  range: RangeType;
  description: string;
  star?: number;
  badge?: string;
};

export function inspectShopPiece(type: PieceType): UnitInspectInfo {
  const def = PIECES[type];
  return {
    id: `shop_${type}`,
    side: "ally",
    name: def.name,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    armor: def.armor,
    atkSpeed: def.atkSpeed,
    rangeLabel: RANGE_LABELS[def.range],
    range: def.range,
    description: def.description,
    star: 1,
    badge: "商店",
  };
}

export function inspectAlly(piece: Piece, phase: ScenePhase): UnitInspectInfo {
  const def = PIECES[piece.type];
  return {
    id: piece.id,
    side: "ally",
    name: def.name,
    hp: piece.hp,
    maxHp: piece.maxHp,
    atk: piece.atk,
    armor: piece.armor,
    atkSpeed: piece.atkSpeed,
    rangeLabel: RANGE_LABELS[piece.range],
    range: piece.range,
    description: def.description,
    star: piece.star,
    badge: phase === "battle" ? "战斗中" : undefined,
  };
}

export function inspectEnemy(enemy: Enemy, phase: ScenePhase): UnitInspectInfo {
  const def = ENEMIES[enemy.type];
  return {
    id: enemy.id,
    side: "enemy",
    name: def.name,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    atk: enemy.atk,
    armor: enemy.armor,
    atkSpeed: enemy.atkSpeed,
    rangeLabel: RANGE_LABELS[enemy.range],
    range: enemy.range,
    description: def.description,
    badge: phase === "prep" ? "本关敌军" : phase === "battle" ? "战斗中" : undefined,
  };
}
