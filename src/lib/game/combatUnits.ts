import { spawnEnemiesForStage } from "@/engine/battle";
import type { Enemy, GameSnapshot, Piece } from "@/types";

/** Live combatants during battle/settlement; prep uses board + stage preview enemies. */
export function combatUnitsFromSnapshot(
  snapshot: GameSnapshot,
): { allies: Piece[]; enemies: Enemy[] } {
  const { battle, board, phase, state } = snapshot;
  if (battle && (phase === "battle" || phase === "settlement")) {
    return { allies: battle.allies, enemies: battle.enemies };
  }

  const showEnemies =
    phase === "prep" || phase === "battle" || phase === "settlement";
  return {
    allies: board,
    enemies: showEnemies ? spawnEnemiesForStage(state.stage) : [],
  };
}
