"use client";

import { journeyNodeAt } from "@/data/journey";
import { BATTLE_MAX_MS, BATTLE_TICK_MS } from "@/engine/constants";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { WoodPanel } from "@/components/game/ui";

/**
 * Bottom-of-stage battle footer: a slim time-remaining progress bar plus the
 * current node label. Fills the empty lower stage area during battle and
 * balances the top HUD so the screen no longer feels top-heavy.
 */
export function BattleFooter() {
  const phase = useGameStore((state) => state.snapshot.phase);
  const battle = useGameStore((state) => state.snapshot.battle);
  const gameState = useGameStore((state) => state.snapshot.state);

  if (phase !== "battle" || !battle) return null;

  const elapsedMs = Math.max(battle.elapsedMs, battle.tick * BATTLE_TICK_MS);
  const remainingMs = Math.max(0, BATTLE_MAX_MS - elapsedMs);
  const progress = Math.min(1, Math.max(0, elapsedMs / BATTLE_MAX_MS));
  const remainingSec = Math.ceil(remainingMs / 1000);

  const node = journeyNodeAt(gameState.journeyIndex);
  const lowTime = remainingSec <= 10;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-[5%] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <WoodPanel
        className="pointer-events-auto w-full max-w-3xl"
        innerClassName="px-3 py-2"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[0.6875rem] font-medium text-kepi-ink-muted">
            {node ? (
              <span className="truncate" title={node.label}>
                {node.label}
              </span>
            ) : (
              "交战中"
            )}
          </span>

          <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-kepi-ink/10">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ease-linear",
                lowTime
                  ? "bg-gradient-to-r from-amber-500 to-red-500"
                  : "bg-gradient-to-r from-sky-600 to-emerald-500",
              )}
              style={{ width: `${progress * 100}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={BATTLE_MAX_MS}
              aria-valuenow={elapsedMs}
              aria-label="战斗进度"
            />
          </div>

          <span
            className={cn(
              "shrink-0 text-[0.6875rem] font-bold tabular-nums",
              lowTime ? "text-amber-800" : "text-kepi-ink",
            )}
          >
            {remainingSec}s
          </span>
        </div>
      </WoodPanel>
    </div>
  );
}
