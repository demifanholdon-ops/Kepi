"use client";

import { ASSET_MANIFEST } from "@/data/assets";
import { PHASE_LABELS } from "@/lib/game/phaseLabels";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { GameIcon, HudMetric, WoodButton } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function HudBar() {
  const snapshot = useGameStore((state) => state.snapshot);
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);
  const { state, phase } = snapshot;

  const kebiReady = state.kebi >= state.kebiThreshold;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-[5%] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <HudMetric
          label="客批"
          icon={UI.kebi}
          value={`${state.kebi}/${state.kebiThreshold}`}
          highlight={kebiReady}
        />
        <HudMetric
          label="金币"
          icon={UI.gold}
          value={String(state.gold)}
        />
        <HudMetric
          label="关卡"
          icon={UI.shop}
          value={`${state.stage}/${state.totalStages}`}
        />
        <HudMetric label="阶段" value={PHASE_LABELS[phase]} />
      </div>

      <div className="pointer-events-auto flex shrink-0 items-center gap-2">
        <WoodButton
          className="px-2.5 py-2 text-sm leading-none"
          onClick={() => setSettingsOpen(true)}
          aria-label="设置"
        >
          ⚙
        </WoodButton>
      </div>
    </header>
  );
}
