import { ASSET_MANIFEST } from "@/data/assets";
import { levelInteractionForNode } from "@/data/levelInteractions";
import { ENEMY_VISUALS } from "@/lib/game/assets";
import type { JourneyNodeType } from "@/types/journey";

const UI = ASSET_MANIFEST.ui;
const BOARD = ASSET_MANIFEST.board;

export function journeyNodeIcon(type: JourneyNodeType): string {
  switch (type) {
    case "battle":
      return UI.journeyNodeBattle;
    case "pawn_shop":
      return UI.journeyNodePawn;
    case "campfire":
      return UI.journeyNodeCampfire;
  }
}

/** Per-node icon — battle nodes use the featured enemy portrait. */
export function journeyNodeIconForNode(node: {
  id: string;
  type: JourneyNodeType;
}): string {
  if (node.type === "battle") {
    const interaction = levelInteractionForNode(node.id);
    if (interaction) {
      return ENEMY_VISUALS[interaction.featuredEnemy].portrait;
    }
  }
  return journeyNodeIcon(node.type);
}

/** Exterior tulou silhouette for the journey repair strip (33 / 66 / 99 tiers). */
export function tulouExteriorForRepair(homeRepair: number): string {
  if (homeRepair >= 99) return BOARD.tulouExteriorGlow;
  if (homeRepair >= 66) return BOARD.tulouExteriorRenew;
  if (homeRepair >= 33) return BOARD.tulouExteriorRepair;
  return BOARD.tulouExteriorRuined;
}

export function isNarrativePhase(phase: string): boolean {
  return phase === "campfire" || phase === "pawn_shop";
}

/** Compact top bar during live combat and the 乡音符 grab window. */
export function isJourneyScrollCompact(phase: string): boolean {
  return phase === "battle" || phase === "opening_buff";
}
