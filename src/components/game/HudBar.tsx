"use client";

import { ASSET_MANIFEST } from "@/data/assets";
import { homeRepairStage } from "@/engine";
import { PHASE_LABELS } from "@/lib/game/phaseLabels";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import {
  GameIcon,
  HudMetric,
  WoodButton,
  WoodPanel,
} from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function HudBar() {
  const snapshot = useGameStore((state) => state.snapshot);
  const setLetterDrawerOpen = useUIStore((state) => state.setLetterDrawerOpen);
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
          className="px-3 py-2 text-xs"
          onClick={() => setLetterDrawerOpen(true)}
          aria-label="打开战况信笺"
        >
          <GameIcon src={UI.homewardTicket} size={18} />
          信笺
        </WoodButton>
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

export function LetterDrawer() {
  const open = useUIStore((state) => state.letterDrawerOpen);
  const setLetterDrawerOpen = useUIStore((state) => state.setLetterDrawerOpen);
  const snapshot = useGameStore((state) => state.snapshot);
  const { state, support } = snapshot;
  const repairStage = homeRepairStage(state.homeRepair);
  const repairLabel =
    repairStage === "ruined"
      ? "破败"
      : repairStage === "repairing"
        ? "修缮中"
        : "焕新";

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        aria-label="关闭信笺"
        onClick={() => setLetterDrawerOpen(false)}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col"
        role="dialog"
        aria-label="战况信笺"
      >
        <WoodPanel
          className="flex h-full flex-col border-r-0"
          letterEdge
          innerClassName="flex flex-1 flex-col overflow-y-auto p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-kepi-ink">战况信笺</h2>
            <WoodButton
              className="px-2.5 py-1 text-xs"
              onClick={() => setLetterDrawerOpen(false)}
            >
              <GameIcon src={UI.back} size={16} />
              收起
            </WoodButton>
          </div>

          <div className="kepi-wood-divider mb-4" />

          <dl className="space-y-3 text-sm">
            <StatRow
              label="存续度"
              icon={UI.survival}
              value={String(state.survival)}
            />
            <StatRow
              label="桑梓值"
              icon={UI.sangzi}
              value={String(state.sangzi)}
            />
            <StatRow
              label="家园修复"
              icon={UI.homeRepair}
              value={`${state.homeRepair}% · 土楼${repairLabel}`}
            />
            <StatRow
              label="连胜 / 连败"
              value={`${state.winStreak} / ${state.loseStreak}`}
            />
            <StatRow
              label="人口上限"
              icon={UI.population}
              value={String(state.population)}
            />
          </dl>

          <div className="kepi-wood-divider my-4" />

          <h3 className="mb-2 text-sm font-medium text-kepi-ink">公益后勤</h3>
          <div className="grid grid-cols-2 gap-2">
            {support.map((unit) => (
              <div key={unit.slot} className="kepi-shop-slot text-center">
                <div className="kepi-shop-slot-inner min-h-0 py-3 text-xs">
                  <GameIcon
                    src={
                      unit.type === "shuike"
                        ? ASSET_MANIFEST.characters.shuike
                        : ASSET_MANIFEST.characters.xiangxian
                    }
                    size={40}
                  />
                  <p className="font-medium text-kepi-ink">
                    {unit.type === "shuike" ? "水客" : "乡贤"}
                  </p>
                  <p className="mt-1 text-[0.65rem] leading-snug text-kepi-ink-muted">
                    {unit.type === "shuike"
                      ? "胜局收信带回桑梓"
                      : "消耗桑梓修缮土楼"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </WoodPanel>
      </aside>
    </>
  );
}

function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-kepi-ink-muted">
        {icon ? <GameIcon src={icon} size={18} /> : null}
        {label}
      </dt>
      <dd className="font-medium tabular-nums text-kepi-ink">{value}</dd>
    </div>
  );
}
