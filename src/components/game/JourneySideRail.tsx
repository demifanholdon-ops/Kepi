"use client";

import { ASSET_MANIFEST } from "@/data/assets";
import { JOURNEY } from "@/data/journey";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { WoodPanel } from "@/components/game/ui";
import { JourneyNodeTrackVertical } from "@/components/game/journey/JourneyTrack";

type JourneySideRailProps = {
  dimmed?: boolean;
};

export function JourneySideRail({ dimmed = false }: JourneySideRailProps) {
  const snapshot = useGameStore((state) => state.snapshot);
  const { state } = snapshot;

  return (
    <aside
      className={cn(
        "kepi-chrome-rail",
        dimmed && "opacity-45 transition-opacity duration-300",
      )}
      aria-label="归途进度"
    >
      <WoodPanel letterEdge className="w-full" innerClassName="px-2 py-2">
        <div className="flex flex-col items-center text-center">
          <p className="text-[0.5625rem] leading-snug text-kepi-ink-muted">{JOURNEY.label}</p>
          <p className="mt-0.5 text-[0.6875rem] font-semibold text-kepi-ink">归途</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums leading-none text-kepi-accent">
            {state.journeyIndex + 1}
            <span className="text-xs font-medium text-kepi-ink-muted">/{state.totalNodes}</span>
          </p>

          <div className="kepi-journey-side-rail-track mt-2 w-full overflow-y-auto">
            <JourneyNodeTrackVertical journeyIndex={state.journeyIndex} />
          </div>
        </div>
      </WoodPanel>
    </aside>
  );
}
