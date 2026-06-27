import type { GameAction, GameSnapshot, ScenePhase } from "@/types";

const PREP_ACTIONS = new Set<GameAction["type"]>([
  "BUY_PIECE",
  "SELL_PIECE",
  "MOVE_PIECE",
  "REFRESH_SHOP",
  "BUY_POPULATION",
  "START_BATTLE",
]);

const BATTLE_ACTIONS = new Set<GameAction["type"]>(["BATTLE_TICK", "END_BATTLE"]);
const SETTLEMENT_ACTIONS = new Set<GameAction["type"]>([
  "ADVANCE_STAGE",
  "APPLY_HOME_REPAIR",
]);

export function canApplyAction(
  snapshot: GameSnapshot,
  action: GameAction,
): boolean {
  if (action.type === "LOAD_SNAPSHOT") return true;

  const phase = snapshot.phase;
  if (phase === "prep") return PREP_ACTIONS.has(action.type);
  if (phase === "battle") return BATTLE_ACTIONS.has(action.type);
  if (phase === "settlement") return SETTLEMENT_ACTIONS.has(action.type);
  return false;
}

export function transitionPhase(
  snapshot: GameSnapshot,
  phase: ScenePhase,
): GameSnapshot {
  return { ...snapshot, phase };
}

export function cloneSnapshot(snapshot: GameSnapshot): GameSnapshot {
  return structuredClone(snapshot);
}
