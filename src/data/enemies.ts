import type { EnemyType } from "@/types";
import type { EnemyDefinition } from "./types";

const ENEMY_BASE = "/images/enemies";

/** Enemy archetypes — PRD §7, scaled per stage in battle module. */
export const ENEMIES: Record<EnemyType, EnemyDefinition> = {
  qianhaibei: {
    type: "qianhaibei",
    name: "迁海碑",
    assetId: "qianhai-stele",
    portrait: `${ENEMY_BASE}/kepi_qianhai-stele.png`,
    hp: 650,
    atk: 35,
    atkSpeed: 0.45,
    armor: 20,
    range: "melee",
    historicalNote: "明清海禁/迁海令，私渡返乡者治罪。",
    description: "长脚界碑，朱红官印镇压，阻挡过番人回乡。",
  },
  luyinguanli: {
    type: "luyinguanli",
    name: "路引关吏",
    assetId: "luyin-clerk",
    portrait: `${ENEMY_BASE}/kepi_luyin-clerk.png`,
    hp: 500,
    atk: 42,
    atkSpeed: 0.5,
    armor: 15,
    range: "melee",
    historicalNote: "水陆要道设卡，无官方路引不得通行。",
    description: "举路引令牌的关卡门神，拦路查票。",
  },
  zhuzaiqi: {
    type: "zhuzaiqi",
    name: "猪仔契",
    assetId: "zhuzai-contract",
    portrait: `${ENEMY_BASE}/kepi_zhuzai-contract.png`,
    hp: 720,
    atk: 32,
    atkSpeed: 0.45,
    armor: 8,
    range: "melee",
    historicalNote: "契约华工卖身契，合约未满无自由。",
    description: "活过来的卖身契卷轴，锁链缠人。",
  },
  ehushan: {
    type: "ehushan",
    name: "饿虎山",
    assetId: "ehu-mountain",
    portrait: `${ENEMY_BASE}/kepi_ehu-mountain.png`,
    hp: 580,
    atk: 55,
    atkSpeed: 0.5,
    armor: 12,
    range: "melee",
    historicalNote: "闽粤赣山区阻隔，空手回乡无生路。",
    description: "拟人化山岭巨兽，枯田怪石挡在归途。",
  },
  hongtouchuan: {
    type: "hongtouchuan",
    name: "红头船",
    assetId: "redhead-ship",
    portrait: `${ENEMY_BASE}/kepi_redhead-ship.png`,
    hp: 480,
    atk: 50,
    atkSpeed: 0.55,
    armor: 8,
    range: "mid",
    historicalNote: "返乡船票与路费极高，普通人终身难凑。",
    description: "拟人化红头船，贴满天价船票索买路钱。",
  },
  xiedouhuo: {
    type: "xiedouhuo",
    name: "械斗火",
    assetId: "melee-fire",
    portrait: `${ENEMY_BASE}/kepi_melee-fire.png`,
    hp: 420,
    atk: 48,
    atkSpeed: 0.7,
    armor: 5,
    range: "melee",
    historicalNote: "土客大械斗，外出者不敢回乡。",
    description: "持械火焰怪物，代表乱世报复的危险。",
  },
} as const;

export const ENEMY_TYPES = Object.keys(ENEMIES) as EnemyType[];

export function enemyDefinition(type: EnemyType): EnemyDefinition {
  return ENEMIES[type];
}

export function scaledEnemyStats(type: EnemyType, scaling: number) {
  const base = ENEMIES[type];
  return {
    hp: Math.round(base.hp * scaling),
    maxHp: Math.round(base.hp * scaling),
    atk: Math.round(base.atk * scaling),
    atkSpeed: base.atkSpeed,
    armor: Math.round(base.armor * scaling),
    range: base.range,
  };
}
