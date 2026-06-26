"use client";

import { EndingScene } from "@/components/game/ending";
import { useGameStore } from "@/store/gameStore";

export function EndingPhase() {
  const snapshot = useGameStore((state) => state.snapshot);
  const resetGame = useGameStore((state) => state.resetGame);
  const { state } = snapshot;
  const result = state.result === "win" ? "win" : "lose";

  return (
    <EndingScene
      className="h-full"
      result={result}
      kebi={state.kebi}
      homeRepair={state.homeRepair}
      survival={state.survival}
      stage={state.stage}
      battleSummary={`第 ${state.stage} 关结束 · 客批 ${state.kebi}/${state.kebiThreshold}`}
      gestureMode="pointer"
      onComplete={() => resetGame()}
    />
  );
}
