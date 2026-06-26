import type { GameSnapshot } from "@/types";
import type { AIPromptInput } from "./types";

export function buildAIPromptFromSnapshot(snapshot: GameSnapshot): AIPromptInput {
  const { state, lastBattleResult } = snapshot;
  const battleSummary = lastBattleResult
    ? `${lastBattleResult.won ? "胜利" : "失败"} · 剩余友军 ${lastBattleResult.alliesRemaining} · 剩余敌军 ${lastBattleResult.enemiesRemaining}`
    : `第 ${state.stage} 关结束 · 客批 ${state.kebi} 封`;

  return {
    stage: state.stage,
    kebi: state.kebi,
    homeRepair: state.homeRepair,
    survival: state.survival,
    battleSummary,
    result:
      state.result === "win" || state.result === "lose" ? state.result : undefined,
  };
}
