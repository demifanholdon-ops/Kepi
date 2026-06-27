import { homeRepairVisualStage } from "@/data/balance";
import { ASSET_MANIFEST } from "@/data/assets";
import type { EnemyType, PieceType } from "@/types";

export type TulouVisualStage = "ruined" | "repairing" | "renewed";
export type TulouRepairStage =
  | "stage1"
  | "stage2"
  | "stage3"
  | "stage4"
  | "stage5"
  | "stage6";

export type UnitVisualMeta = {
  label: string;
  shortLabel: string;
  color: string;
  portrait: string;
  placeholder: string;
};

export const TULOU_BOARD_ASSETS = {
  stage1: ASSET_MANIFEST.board.tulouStage1,
  stage2: ASSET_MANIFEST.board.tulouStage2,
  stage3: ASSET_MANIFEST.board.tulouStage3,
  stage4: ASSET_MANIFEST.board.tulouStage4,
  stage5: ASSET_MANIFEST.board.tulouStage5,
  stage6: ASSET_MANIFEST.board.tulouStage6,
} as const;

export const PIECE_VISUALS: Record<PieceType, UnitVisualMeta> = {
  farmer: {
    label: "农民",
    shortLabel: "农",
    color: "#4a6fa5",
    portrait: ASSET_MANIFEST.characters.farmer.star1,
    placeholder: "/images/characters/farmer.svg",
  },
  guard: {
    label: "守卫",
    shortLabel: "卫",
    color: "#3d5a80",
    portrait: ASSET_MANIFEST.characters.guard.star1,
    placeholder: "/images/characters/guard.svg",
  },
  teacher: {
    label: "教书先生",
    shortLabel: "师",
    color: "#5c7a99",
    portrait: ASSET_MANIFEST.characters.teacher.star1,
    placeholder: "/images/characters/teacher.svg",
  },
  fengshui: {
    label: "风水先生",
    shortLabel: "风",
    color: "#2f4858",
    portrait: ASSET_MANIFEST.characters.fengshui.star1,
    placeholder: "/images/characters/fengshui.svg",
  },
  patriarch: {
    label: "族长",
    shortLabel: "长",
    color: "#1b263b",
    portrait: ASSET_MANIFEST.characters.patriarch.star1,
    placeholder: "/images/characters/patriarch.svg",
  },
};

export const ENEMY_VISUALS: Record<EnemyType, UnitVisualMeta> = {
  qianhaibei: {
    label: "钱海北",
    shortLabel: "钱",
    color: "#7b4b4b",
    portrait: ASSET_MANIFEST.enemies.qianhaibei,
    placeholder: "/images/enemies/qianhaibei.svg",
  },
  luyinguanli: {
    label: "陆营官吏",
    shortLabel: "陆",
    color: "#6b3a3a",
    portrait: ASSET_MANIFEST.enemies.luyinguanli,
    placeholder: "/images/enemies/luyinguanli.svg",
  },
  zhuzaiqi: {
    label: "猪仔契",
    shortLabel: "契",
    color: "#8c4a4a",
    portrait: ASSET_MANIFEST.enemies.zhuzaiqi,
    placeholder: "/images/enemies/zhuzaiqi.svg",
  },
  ehushan: {
    label: "鹅湖山",
    shortLabel: "鹅",
    color: "#5c4033",
    portrait: ASSET_MANIFEST.enemies.ehushan,
    placeholder: "/images/enemies/ehushan.svg",
  },
  hongtouchuan: {
    label: "红头船",
    shortLabel: "船",
    color: "#9b2c2c",
    portrait: ASSET_MANIFEST.enemies.hongtouchuan,
    placeholder: "/images/enemies/hongtouchuan.svg",
  },
  xiedouhuo: {
    label: "械斗火",
    shortLabel: "火",
    color: "#b45309",
    portrait: ASSET_MANIFEST.enemies.xiedouhuo,
    placeholder: "/images/enemies/xiedouhuo.svg",
  },
};

export const TULOU_STAGE_LABELS: Record<TulouVisualStage, string> = {
  ruined: "破败",
  repairing: "修缮",
  renewed: "翻新",
};

export const TULOU_REPAIR_STAGE_LABELS: Record<TulouRepairStage, string> = {
  stage1: "破败",
  stage2: "井台复水",
  stage3: "墙门修缮",
  stage4: "屋瓦补齐",
  stage5: "祠堂点灯",
  stage6: "桑梓焕新",
};

export function homeRepairStageLabel(homeRepair: number): string {
  return TULOU_REPAIR_STAGE_LABELS[homeRepairVisualStage(homeRepair)];
}

/** Canvas glow bucket — early / mid / late repair bands. */
export function homeRepairThemeStage(homeRepair: number): TulouVisualStage {
  const stage = homeRepairVisualStage(homeRepair);
  if (stage === "stage1" || stage === "stage2") return "ruined";
  if (stage === "stage6") return "renewed";
  return "repairing";
}
