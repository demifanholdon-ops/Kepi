"use client";

import { ASSET_MANIFEST } from "@/data/assets";
import { homeRepairStage } from "@/engine";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { GameIcon, WoodButton, WoodPanel } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function LetterStrip() {
  const snapshot = useGameStore((state) => state.snapshot);
  const expanded = useUIStore((state) => state.letterStripExpanded);
  const setExpanded = useUIStore((state) => state.setLetterStripExpanded);
  const { state, support, phase } = snapshot;

  if (phase === "ending" || phase === "settings") return null;

  const repairStage = homeRepairStage(state.homeRepair);
  const repairLabel =
    repairStage === "ruined"
      ? "破败"
      : repairStage === "repairing"
        ? "修缮中"
        : "焕新";

  return (
    <div className="pointer-events-auto mx-auto w-full max-w-5xl">
      <WoodPanel
        className={cn("kepi-letter-strip transition-[filter]", expanded && "kepi-letter-strip-expanded")}
        innerClassName="px-3 py-2"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-kepi-ink">
            <GameIcon src={UI.homewardTicket} size={16} />
            战况信笺
          </span>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.6875rem] text-kepi-ink-muted">
            <Metric icon={UI.survival} label="存续" value={String(state.survival)} />
            <Metric icon={UI.sangzi} label="桑梓" value={String(state.sangzi)} />
            <Metric
              icon={UI.homeRepair}
              label="修复"
              value={`${state.homeRepair}%`}
              hint={repairLabel}
            />
            <span className="tabular-nums">
              连胜 {state.winStreak} · 连败 {state.loseStreak}
            </span>
          </div>

          <WoodButton
            className="shrink-0 px-2 py-1 text-[0.65rem]"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            后勤 {expanded ? "▴" : "▾"}
          </WoodButton>
        </div>

        {expanded ? (
          <>
            <div className="kepi-wood-divider my-2.5" />
            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-kepi-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <GameIcon src={UI.population} size={14} />
                人口上限 {state.population}
              </span>
              <span>
                客批 {state.kebi}/{state.kebiThreshold}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {support.map((unit) => (
                <div key={unit.slot} className="kepi-letter-support-card">
                  <GameIcon
                    src={
                      unit.type === "shuike"
                        ? ASSET_MANIFEST.characters.shuike
                        : ASSET_MANIFEST.characters.xiangxian
                    }
                    size={28}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-kepi-ink">
                      {unit.type === "shuike" ? "水客" : "乡贤"}
                    </p>
                    <p className="text-[0.625rem] leading-snug text-kepi-ink-muted">
                      {unit.type === "shuike"
                        ? "胜局收信带回桑梓"
                        : "消耗桑梓修缮土楼"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </WoodPanel>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <GameIcon src={icon} size={14} />
      {label} {value}
      {hint ? <span className="text-kepi-ink-muted/80">({hint})</span> : null}
    </span>
  );
}
