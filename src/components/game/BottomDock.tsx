"use client";

import { useGameStore } from "@/store/gameStore";
import { LetterStrip } from "./LetterStrip";
import { ShopPanel } from "./ShopStrip";

export function BottomDock() {
  const phase = useGameStore((state) => state.snapshot.phase);

  if (phase === "ending" || phase === "settings") return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1.5 px-[5%] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <LetterStrip />
      {phase === "prep" ? <ShopPanel /> : null}
    </div>
  );
}
